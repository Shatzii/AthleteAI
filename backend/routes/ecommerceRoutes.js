// E-commerce API Routes
// Marketplace endpoints for products, cart, orders, and payments

const express = require('express');
const router = express.Router();
const ecommerceService = require('../services/ecommerceService');
const { verifyToken } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Initialize service on startup
ecommerceService.initialize().catch(console.error);

/**
 * @route GET /api/ecommerce/stats
 * @desc Get e-commerce statistics
 * @access Private (Admin)
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    // Only admins can access stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stats = ecommerceService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching e-commerce stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * @route GET /api/ecommerce/products
 * @desc Get products with optional filtering and search
 * @access Public
 */
router.get('/products', [
  query('category').optional().isString(),
  query('subcategory').optional().isString(),
  query('search').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('sortBy').optional().isIn(['price_asc', 'price_desc', 'rating', 'newest']),
  query('limit').optional().isNumeric(),
  query('offset').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      sortBy,
      limit = 20,
      offset = 0
    } = req.query;

    let products;

    if (search || category || minPrice || maxPrice || sortBy) {
      // Search with filters
      products = ecommerceService.searchProducts(search, {
        category,
        subcategory,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy
      });
    } else if (category) {
      // Get products by category
      products = ecommerceService.getProductsByCategory(category, subcategory);
    } else {
      // Get all products
      products = Array.from(ecommerceService.products.values()).filter(p => p.isActive);
    }

    // Apply pagination
    const total = products.length;
    products = products.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

/**
 * @route GET /api/ecommerce/products/:productId
 * @desc Get product details
 * @access Public
 */
router.get('/products/:productId', [
  param('productId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const product = ecommerceService.getProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get related products
    const relatedProducts = ecommerceService.getRelatedProducts(productId);

    res.json({
      success: true,
      data: {
        product,
        relatedProducts
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

/**
 * @route GET /api/ecommerce/categories
 * @desc Get product categories
 * @access Public
 */
router.get('/categories', async (req, res) => {
  try {
    res.json({
      success: true,
      data: ecommerceService.categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

/**
 * @route POST /api/ecommerce/cart
 * @desc Create a new shopping cart
 * @access Private
 */
router.post('/cart', verifyToken, async (req, res) => {
  try {
    const cart = ecommerceService.createCart(req.user.id);

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Error creating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cart'
    });
  }
});

/**
 * @route GET /api/ecommerce/cart/:cartId
 * @desc Get cart contents
 * @access Private
 */
router.get('/cart/:cartId', verifyToken, [
  param('cartId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // In a real implementation, you'd store carts in a database
    // For now, we'll return a mock cart
    const cart = ecommerceService.createCart(req.user.id);

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

/**
 * @route POST /api/ecommerce/cart/:cartId/items
 * @desc Add item to cart
 * @access Private
 */
router.post('/cart/:cartId/items', [
  verifyToken,
  param('cartId').isString().notEmpty(),
  body('productId').isString().notEmpty(),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('variant').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cartId } = req.params;
    const { productId, quantity, variant } = req.body;

    // In a real implementation, you'd retrieve the cart from database
    let cart = ecommerceService.createCart(req.user.id);

    cart = ecommerceService.addToCart(cart, productId, parseInt(quantity), variant);

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route PUT /api/ecommerce/cart/:cartId/items
 * @desc Update cart item quantity
 * @access Private
 */
router.put('/cart/:cartId/items', [
  verifyToken,
  param('cartId').isString().notEmpty(),
  body('productId').isString().notEmpty(),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('variant').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cartId } = req.params;
    const { productId, quantity, variant } = req.body;

    // Mock cart - in real implementation, retrieve from database
    let cart = ecommerceService.createCart(req.user.id);

    cart = ecommerceService.updateCartItem(cart, productId, parseInt(quantity), variant);

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/ecommerce/cart/:cartId/items
 * @desc Remove item from cart
 * @access Private
 */
router.delete('/cart/:cartId/items', [
  verifyToken,
  param('cartId').isString().notEmpty(),
  body('productId').isString().notEmpty(),
  body('variant').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cartId } = req.params;
    const { productId, variant } = req.body;

    // Mock cart - in real implementation, retrieve from database
    let cart = ecommerceService.createCart(req.user.id);

    cart = ecommerceService.removeFromCart(cart, productId, variant);

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/ecommerce/checkout
 * @desc Process checkout and create order
 * @access Private
 */
router.post('/checkout', [
  verifyToken,
  body('cartId').isString().notEmpty(),
  body('customerInfo').isObject().withMessage('Customer info is required'),
  body('customerInfo.name').isString().notEmpty(),
  body('customerInfo.email').isString().isEmail(),
  body('shippingInfo').isObject().withMessage('Shipping info is required'),
  body('shippingInfo.address').isString().notEmpty(),
  body('shippingInfo.city').isString().notEmpty(),
  body('shippingInfo.state').isString().notEmpty(),
  body('shippingInfo.zipCode').isString().notEmpty(),
  body('paymentInfo').isObject().withMessage('Payment info is required'),
  body('paymentInfo.paymentMethodId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cartId, customerInfo, shippingInfo, paymentInfo } = req.body;

    // Mock cart - in real implementation, retrieve from database
    const cart = ecommerceService.createCart(req.user.id);

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const order = await ecommerceService.createOrder(cart, customerInfo, shippingInfo, paymentInfo);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/ecommerce/orders
 * @desc Get customer orders
 * @access Private
 */
router.get('/orders', verifyToken, [
  query('limit').optional().isNumeric(),
  query('offset').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { limit = 20, offset = 0 } = req.query;

    const orders = ecommerceService.getCustomerOrders(req.user.id);
    const total = orders.length;
    const paginatedOrders = orders.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        orders: paginatedOrders,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

/**
 * @route GET /api/ecommerce/orders/:orderId
 * @desc Get order details
 * @access Private
 */
router.get('/orders/:orderId', [
  verifyToken,
  param('orderId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const order = ecommerceService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

/**
 * @route GET /api/ecommerce/recommendations
 * @desc Get product recommendations
 * @access Private
 */
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    // Mock data - in real implementation, get from user history
    const viewedProducts = [];
    const purchasedProducts = [];

    const recommendations = ecommerceService.generateRecommendations(
      req.user.id,
      viewedProducts,
      purchasedProducts
    );

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
});

/**
 * @route POST /api/ecommerce/refund/:orderId
 * @desc Process refund for order
 * @access Private (Admin)
 */
router.post('/refund/:orderId', [
  verifyToken,
  param('orderId').isString().notEmpty(),
  body('amount').optional().isNumeric(),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only admins can process refunds
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { orderId } = req.params;
    const { amount, reason = 'customer_request' } = req.body;

    const refund = await ecommerceService.processRefund(orderId, amount, reason);

    res.json({
      success: true,
      data: refund
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route PUT /api/ecommerce/inventory/:productId
 * @desc Update product inventory
 * @access Private (Admin)
 */
router.put('/inventory/:productId', [
  verifyToken,
  param('productId').isString().notEmpty(),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('variant').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only admins can update inventory
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { productId } = req.params;
    const { quantity, variant } = req.body;

    ecommerceService.updateInventory(productId, parseInt(quantity), variant);

    res.json({
      success: true,
      message: 'Inventory updated successfully'
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory'
    });
  }
});

module.exports = router;