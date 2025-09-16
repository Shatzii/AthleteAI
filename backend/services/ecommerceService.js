// E-commerce Integration Service
// Marketplace for training equipment and supplements with payment processing

const mongoose = require('mongoose');
const Stripe = require('stripe');
const axios = require('axios');

class EcommerceService {
  constructor() {
    this.stripe = null;
    this.products = new Map();
    this.orders = new Map();
    this.inventory = new Map();

    // Initialize Stripe if API key is available
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    this.metrics = {
      products: 0,
      orders: 0,
      revenue: 0,
      customers: 0
    };

    // Product categories
    this.categories = {
      equipment: ['football', 'training', 'protective', 'accessories'],
      supplements: ['protein', 'creatine', 'vitamins', 'recovery'],
      apparel: ['jerseys', 'training-wear', 'footwear'],
      technology: ['wearables', 'apps', 'analysis-tools']
    };

    // Shipping configuration
    this.shipping = {
      rates: {
        standard: { cost: 9.99, days: '5-7' },
        express: { cost: 19.99, days: '2-3' },
        overnight: { cost: 39.99, days: '1-2' }
      },
      freeThreshold: 75.00
    };
  }

  /**
   * Initialize the e-commerce service
   */
  async initialize() {
    try {
      if (this.stripe) {
        console.log('💳 Stripe payment processing initialized');
      } else {
        console.warn('⚠️  Stripe API key not found. Payment processing disabled.');
      }

      // Initialize product catalog
      await this.initializeProductCatalog();

      // Initialize inventory tracking
      await this.initializeInventory();

      console.log('✅ E-commerce service initialized');
      console.log(`🛍️  Product catalog: ${this.products.size} items`);
      console.log(`📦 Inventory tracking: ${this.inventory.size} items`);

    } catch (error) {
      console.error('❌ Failed to initialize e-commerce service:', error);
      throw error;
    }
  }

  /**
   * Initialize product catalog with sample products
   */
  async initializeProductCatalog() {
    // Football Equipment
    this.addProduct({
      id: 'fb-helmet-001',
      name: 'Professional Football Helmet',
      category: 'equipment',
      subcategory: 'protective',
      price: 299.99,
      description: 'Advanced protection with superior comfort and ventilation',
      features: ['Impact-absorbing padding', 'Adjustable fit', 'Ventilation system'],
      images: ['/uploads/products/helmet-1.jpg'],
      variants: [
        { size: 'S', price: 299.99, stock: 25 },
        { size: 'M', price: 299.99, stock: 30 },
        { size: 'L', price: 299.99, stock: 20 }
      ],
      tags: ['helmet', 'protection', 'professional']
    });

    // Training Equipment
    this.addProduct({
      id: 'train-agility-001',
      name: 'Agility Ladder Pro',
      category: 'equipment',
      subcategory: 'training',
      price: 49.99,
      description: 'Professional-grade agility ladder for speed and footwork training',
      features: ['Adjustable length', 'Durable construction', 'Carrying case included'],
      images: ['/uploads/products/agility-ladder.jpg'],
      variants: [],
      stock: 100,
      tags: ['agility', 'speed', 'training']
    });

    // Supplements
    this.addProduct({
      id: 'supp-whey-001',
      name: 'Premium Whey Protein Isolate',
      category: 'supplements',
      subcategory: 'protein',
      price: 59.99,
      description: '25g of pure whey protein per serving with minimal carbs and fat',
      features: ['25g protein per serving', 'Low carb', 'Great taste', 'Mixes easily'],
      images: ['/uploads/products/whey-protein.jpg'],
      variants: [
        { flavor: 'Chocolate', price: 59.99, stock: 50 },
        { flavor: 'Vanilla', price: 59.99, stock: 45 },
        { flavor: 'Strawberry', price: 59.99, stock: 40 }
      ],
      tags: ['protein', 'whey', 'recovery']
    });

    // Wearables
    this.addProduct({
      id: 'tech-tracker-001',
      name: 'Athlete Performance Tracker',
      category: 'technology',
      subcategory: 'wearables',
      price: 199.99,
      description: 'Advanced wearable device for comprehensive performance tracking',
      features: ['Heart rate monitoring', 'GPS tracking', 'Impact analysis', 'Mobile app integration'],
      images: ['/uploads/products/performance-tracker.jpg'],
      variants: [],
      stock: 75,
      tags: ['wearable', 'tracking', 'performance']
    });

    this.metrics.products = this.products.size;
  }

  /**
   * Initialize inventory tracking
   */
  async initializeInventory() {
    // Initialize inventory for all products
    for (const [productId, product] of this.products) {
      if (product.variants && product.variants.length > 0) {
        // Product with variants
        for (const variant of product.variants) {
          const inventoryKey = `${productId}_${JSON.stringify(variant).replace(/[^a-zA-Z0-9]/g, '_')}`;
          this.inventory.set(inventoryKey, {
            productId,
            variant,
            quantity: variant.stock || 0,
            reserved: 0,
            lastUpdated: new Date()
          });
        }
      } else {
        // Simple product
        this.inventory.set(productId, {
          productId,
          quantity: product.stock || 0,
          reserved: 0,
          lastUpdated: new Date()
        });
      }
    }
  }

  /**
   * Add a product to the catalog
   */
  addProduct(productData) {
    const product = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      rating: 0,
      reviewCount: 0
    };

    this.products.set(product.id, product);
    return product;
  }

  /**
   * Get product by ID
   */
  getProduct(productId) {
    return this.products.get(productId);
  }

  /**
   * Get products by category
   */
  getProductsByCategory(category, subcategory = null) {
    const products = Array.from(this.products.values())
      .filter(product => product.isActive && product.category === category);

    if (subcategory) {
      return products.filter(product => product.subcategory === subcategory);
    }

    return products;
  }

  /**
   * Search products
   */
  searchProducts(query, filters = {}) {
    let products = Array.from(this.products.values())
      .filter(product => product.isActive);

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    if (filters.category) {
      products = products.filter(product => product.category === filters.category);
    }

    // Price range filter
    if (filters.minPrice) {
      products = products.filter(product => product.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
      products = products.filter(product => product.price <= filters.maxPrice);
    }

    // Sort
    if (filters.sortBy) {
      products.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'rating':
            return b.rating - a.rating;
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          default:
            return 0;
        }
      });
    }

    return products;
  }

  /**
   * Create a shopping cart
   */
  createCart(customerId) {
    const cartId = `cart_${customerId}_${Date.now()}`;
    const cart = {
      id: cartId,
      customerId,
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return cart;
  }

  /**
   * Add item to cart
   */
  addToCart(cart, productId, quantity = 1, variant = null) {
    const product = this.getProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check inventory
    if (!this.checkInventory(productId, quantity, variant)) {
      throw new Error('Insufficient inventory');
    }

    // Find existing item in cart
    let cartItem = cart.items.find(item =>
      item.productId === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = {
        productId,
        name: product.name,
        price: product.price,
        quantity,
        variant,
        image: product.images[0]
      };
      cart.items.push(cartItem);
    }

    this.updateCartTotals(cart);
    cart.updatedAt = new Date();

    return cart;
  }

  /**
   * Remove item from cart
   */
  removeFromCart(cart, productId, variant = null) {
    cart.items = cart.items.filter(item =>
      !(item.productId === productId &&
        JSON.stringify(item.variant) === JSON.stringify(variant))
    );

    this.updateCartTotals(cart);
    cart.updatedAt = new Date();

    return cart;
  }

  /**
   * Update cart item quantity
   */
  updateCartItem(cart, productId, quantity, variant = null) {
    const cartItem = cart.items.find(item =>
      item.productId === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (!cartItem) {
      throw new Error('Item not found in cart');
    }

    // Check inventory
    if (!this.checkInventory(productId, quantity, variant)) {
      throw new Error('Insufficient inventory');
    }

    cartItem.quantity = quantity;
    this.updateCartTotals(cart);
    cart.updatedAt = new Date();

    return cart;
  }

  /**
   * Update cart totals
   */
  updateCartTotals(cart) {
    cart.subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    cart.tax = cart.subtotal * 0.08; // 8% tax rate
    cart.shipping = cart.subtotal >= this.shipping.freeThreshold ? 0 : this.shipping.rates.standard.cost;
    cart.total = cart.subtotal + cart.tax + cart.shipping;
  }

  /**
   * Check inventory availability
   */
  checkInventory(productId, quantity, variant = null) {
    const inventoryKey = variant ?
      `${productId}_${JSON.stringify(variant).replace(/[^a-zA-Z0-9]/g, '_')}` :
      productId;

    const inventory = this.inventory.get(inventoryKey);
    if (!inventory) return false;

    return (inventory.quantity - inventory.reserved) >= quantity;
  }

  /**
   * Reserve inventory for order
   */
  reserveInventory(orderItems) {
    const reservations = [];

    for (const item of orderItems) {
      const inventoryKey = item.variant ?
        `${item.productId}_${JSON.stringify(item.variant).replace(/[^a-zA-Z0-9]/g, '_')}` :
        item.productId;

      const inventory = this.inventory.get(inventoryKey);
      if (!inventory || (inventory.quantity - inventory.reserved) < item.quantity) {
        // Release previous reservations
        this.releaseInventoryReservations(reservations);
        throw new Error(`Insufficient inventory for ${item.name}`);
      }

      inventory.reserved += item.quantity;
      reservations.push({ inventoryKey, quantity: item.quantity });
    }

    return reservations;
  }

  /**
   * Release inventory reservations
   */
  releaseInventoryReservations(reservations) {
    for (const reservation of reservations) {
      const inventory = this.inventory.get(reservation.inventoryKey);
      if (inventory) {
        inventory.reserved = Math.max(0, inventory.reserved - reservation.quantity);
      }
    }
  }

  /**
   * Process payment with Stripe
   */
  async processPayment(orderData, paymentMethodId) {
    if (!this.stripe) {
      throw new Error('Payment processing not available');
    }

    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(orderData.total * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: `AthleteAI Order #${orderData.id}`,
        metadata: {
          orderId: orderData.id,
          customerId: orderData.customerId
        }
      });

      return {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      };

    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error('Payment failed: ' + error.message);
    }
  }

  /**
   * Create order
   */
  async createOrder(cart, customerInfo, shippingInfo, paymentInfo) {
    try {
      // Reserve inventory
      const reservations = this.reserveInventory(cart.items);

      // Process payment
      let paymentResult = null;
      if (paymentInfo.paymentMethodId) {
        paymentResult = await this.processPayment(cart, paymentInfo.paymentMethodId);
      }

      // Create order
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const order = {
        id: orderId,
        customerId: cart.customerId,
        customerInfo,
        shippingInfo,
        items: cart.items,
        pricing: {
          subtotal: cart.subtotal,
          tax: cart.tax,
          shipping: cart.shipping,
          total: cart.total
        },
        payment: paymentResult,
        status: paymentResult ? 'paid' : 'pending_payment',
        tracking: {
          status: 'processing',
          estimatedDelivery: this.calculateDeliveryDate()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.orders.set(orderId, order);
      this.metrics.orders++;

      // Update revenue metrics
      if (paymentResult && paymentResult.status === 'succeeded') {
        this.metrics.revenue += cart.total;
      }

      return order;

    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  getOrder(orderId) {
    return this.orders.get(orderId);
  }

  /**
   * Get customer orders
   */
  getCustomerOrders(customerId) {
    return Array.from(this.orders.values())
      .filter(order => order.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId, status, trackingInfo = null) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date();

    if (trackingInfo) {
      order.tracking = { ...order.tracking, ...trackingInfo };
    }

    return order;
  }

  /**
   * Calculate estimated delivery date
   */
  calculateDeliveryDate() {
    const shippingDays = this.shipping.rates.standard.days.split('-')[1]; // Use max days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + parseInt(shippingDays));

    return deliveryDate;
  }

  /**
   * Generate product recommendations
   */
  generateRecommendations(customerId, viewedProducts = [], purchasedProducts = []) {
    const recommendations = [];

    // Based on purchase history
    if (purchasedProducts.length > 0) {
      const lastPurchase = purchasedProducts[purchasedProducts.length - 1];
      const relatedProducts = this.getRelatedProducts(lastPurchase);
      recommendations.push(...relatedProducts.slice(0, 3));
    }

    // Popular products in viewed categories
    if (viewedProducts.length > 0) {
      const categories = viewedProducts.map(id => this.getProduct(id)?.category).filter(Boolean);
      const popularInCategory = this.getPopularProductsByCategory(categories[0]);
      recommendations.push(...popularInCategory.slice(0, 2));
    }

    // Trending products
    const trending = this.getTrendingProducts();
    recommendations.push(...trending.slice(0, 2));

    // Remove duplicates and limit to 5
    const uniqueRecommendations = recommendations
      .filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      )
      .slice(0, 5);

    return uniqueRecommendations;
  }

  /**
   * Get related products
   */
  getRelatedProducts(productId) {
    const product = this.getProduct(productId);
    if (!product) return [];

    return Array.from(this.products.values())
      .filter(p =>
        p.id !== productId &&
        p.isActive &&
        (p.category === product.category || p.tags.some(tag => product.tags.includes(tag)))
      )
      .slice(0, 5);
  }

  /**
   * Get popular products by category
   */
  getPopularProductsByCategory(category) {
    return Array.from(this.products.values())
      .filter(p => p.category === category && p.isActive)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5);
  }

  /**
   * Get trending products
   */
  getTrendingProducts() {
    // Simple trending logic - could be enhanced with real analytics
    return Array.from(this.products.values())
      .filter(p => p.isActive)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }

  /**
   * Get e-commerce statistics
   */
  getStats() {
    return {
      totalProducts: this.metrics.products,
      totalOrders: this.metrics.orders,
      totalRevenue: this.metrics.revenue,
      totalCustomers: this.metrics.customers,
      activeProducts: Array.from(this.products.values()).filter(p => p.isActive).length,
      lowStockItems: Array.from(this.inventory.values()).filter(i => i.quantity - i.reserved < 10).length,
      categories: Object.keys(this.categories).length,
      lastUpdated: new Date()
    };
  }

  /**
   * Update product inventory
   */
  updateInventory(productId, quantity, variant = null) {
    const inventoryKey = variant ?
      `${productId}_${JSON.stringify(variant).replace(/[^a-zA-Z0-9]/g, '_')}` :
      productId;

    const inventory = this.inventory.get(inventoryKey);
    if (inventory) {
      inventory.quantity = quantity;
      inventory.lastUpdated = new Date();
    }
  }

  /**
   * Process refund
   */
  async processRefund(orderId, amount = null, reason = 'customer_request') {
    if (!this.stripe) {
      throw new Error('Refund processing not available');
    }

    const order = this.getOrder(orderId);
    if (!order || !order.payment) {
      throw new Error('Order or payment not found');
    }

    try {
      const refundAmount = amount || order.pricing.total;

      const refund = await this.stripe.refunds.create({
        payment_intent: order.payment.paymentIntentId,
        amount: Math.round(refundAmount * 100),
        reason: reason,
        metadata: {
          orderId: orderId,
          reason: reason
        }
      });

      // Update order status
      order.status = 'refunded';
      order.refund = {
        id: refund.id,
        amount: refundAmount,
        reason: reason,
        processedAt: new Date()
      };
      order.updatedAt = new Date();

      return refund;

    } catch (error) {
      console.error('Refund processing error:', error);
      throw new Error('Refund failed: ' + error.message);
    }
  }
}

// Export singleton instance
const ecommerceService = new EcommerceService();
module.exports = ecommerceService;