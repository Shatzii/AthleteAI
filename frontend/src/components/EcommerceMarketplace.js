// E-commerce Marketplace Component
// Complete shopping interface with products, cart, and checkout

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Star, Plus, Minus, Trash2, CreditCard, Truck, Shield } from 'lucide-react';
import api from '../services/api';

const EcommerceMarketplace = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load categories
      const categoriesResponse = await api.get('/ecommerce/categories');
      if (categoriesResponse.data.success) {
        setCategories(categoriesResponse.data.data);
      }

      // Create or load cart
      const cartResponse = await api.post('/ecommerce/cart');
      if (cartResponse.data.success) {
        setCart(cartResponse.data.data);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await api.get(`/ecommerce/products?${params}`);
      if (response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addToCart = async (productId, quantity = 1, variant = null) => {
    try {
      if (!cart) return;

      const response = await api.post(`/ecommerce/cart/${cart.id}/items`, {
        productId,
        quantity,
        variant
      });

      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  const updateCartItem = async (productId, quantity, variant = null) => {
    try {
      if (!cart) return;

      const response = await api.put(`/ecommerce/cart/${cart.id}/items`, {
        productId,
        quantity,
        variant
      });

      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      alert('Failed to update cart item');
    }
  };

  const removeFromCart = async (productId, variant = null) => {
    try {
      if (!cart) return;

      const response = await api.delete(`/ecommerce/cart/${cart.id}/items`, {
        data: { productId, variant }
      });

      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item from cart');
    }
  };

  const proceedToCheckout = () => {
    setShowCart(false);
    setCheckoutStep(1);
  };

  const processCheckout = async () => {
    try {
      const response = await api.post('/ecommerce/checkout', {
        cartId: cart.id,
        customerInfo,
        shippingInfo,
        paymentInfo: {} // Payment processing would be implemented here
      });

      if (response.data.success) {
        alert('Order placed successfully!');
        // Reset cart and form
        setCart(null);
        setCustomerInfo({ name: '', email: '', phone: '' });
        setShippingInfo({ address: '', city: '', state: '', zipCode: '' });
        setCheckoutStep(1);
        loadInitialData();
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      alert('Failed to process order');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AthleteAI Marketplace</h1>
          <p className="text-gray-600 mt-2">Premium training equipment and supplements</p>
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Cart
          {cart && cart.items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cart.items.length}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {Object.entries(categories).map(([key, subcategories]) => (
              <optgroup key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub.charAt(0).toUpperCase() + sub.slice(1)}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Price Range */}
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.min}
              onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.max}
              onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sort By</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
          />
        ))}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateItem={updateCartItem}
          onRemoveItem={removeFromCart}
          onCheckout={proceedToCheckout}
        />
      )}

      {/* Checkout Modal */}
      {checkoutStep > 0 && (
        <CheckoutModal
          step={checkoutStep}
          cart={cart}
          customerInfo={customerInfo}
          shippingInfo={shippingInfo}
          onUpdateCustomerInfo={setCustomerInfo}
          onUpdateShippingInfo={setShippingInfo}
          onNext={() => setCheckoutStep(checkoutStep + 1)}
          onPrevious={() => setCheckoutStep(checkoutStep - 1)}
          onComplete={processCheckout}
          onClose={() => setCheckoutStep(0)}
        />
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-w-1 aspect-h-1 bg-gray-200">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center mb-3">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
          <div className="flex items-center ml-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 ml-1">
              {product.rating || 0} ({product.reviewCount || 0})
            </span>
          </div>
        </div>

        {product.variants && product.variants.length > 0 && (
          <select
            value={JSON.stringify(selectedVariant)}
            onChange={(e) => setSelectedVariant(JSON.parse(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm"
          >
            <option value="null">Select variant</option>
            {product.variants.map((variant, index) => (
              <option key={index} value={JSON.stringify(variant)}>
                {Object.entries(variant).map(([key, value]) => `${key}: ${value}`).join(', ')}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => onAddToCart(product.id, 1, selectedVariant)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

// Cart Sidebar Component
const CartSidebar = ({ cart, onClose, onUpdateItem, onRemoveItem, onCheckout }) => {
  if (!cart) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {cart.items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Your cart is empty</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 border-b pb-4">
                    <img
                      src={item.image || '/placeholder-product.jpg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">${item.price}</p>
                      {item.variant && (
                        <p className="text-xs text-gray-500">
                          {Object.entries(item.variant).map(([key, value]) => `${key}: ${value}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUpdateItem(item.productId, item.quantity - 1, item.variant)}
                        className="p-1 border rounded hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateItem(item.productId, item.quantity + 1, item.variant)}
                        className="p-1 border rounded hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.productId, item.variant)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${cart.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${cart.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{cart.shipping === 0 ? 'FREE' : `$${cart.shipping?.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${cart.total?.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 mt-6"
              >
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Checkout Modal Component
const CheckoutModal = ({
  step,
  cart,
  customerInfo,
  shippingInfo,
  onUpdateCustomerInfo,
  onUpdateShippingInfo,
  onNext,
  onPrevious,
  onComplete,
  onClose
}) => {
  const steps = ['Customer Information', 'Shipping Address', 'Payment', 'Review Order'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center mb-8">
            {steps.map((stepName, index) => (
              <React.Fragment key={index}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 ${index + 1 === step ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                  {stepName}
                </span>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    index + 1 < step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerInfo.name}
                  onChange={(e) => onUpdateCustomerInfo({...customerInfo, name: e.target.value})}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerInfo.email}
                  onChange={(e) => onUpdateCustomerInfo({...customerInfo, email: e.target.value})}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone Number"
                value={customerInfo.phone}
                onChange={(e) => onUpdateCustomerInfo({...customerInfo, phone: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Shipping Address</h3>
              <input
                type="text"
                placeholder="Street Address"
                value={shippingInfo.address}
                onChange={(e) => onUpdateShippingInfo({...shippingInfo, address: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={shippingInfo.city}
                  onChange={(e) => onUpdateShippingInfo({...shippingInfo, city: e.target.value})}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={shippingInfo.state}
                  onChange={(e) => onUpdateShippingInfo({...shippingInfo, state: e.target.value})}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={shippingInfo.zipCode}
                  onChange={(e) => onUpdateShippingInfo({...shippingInfo, zipCode: e.target.value})}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payment Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-600">Secure payment powered by Stripe</span>
                </div>
                <p className="text-sm text-gray-500">
                  Payment processing will be implemented in the next step.
                  For now, orders will be processed as cash on delivery.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review Your Order</h3>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-4">Order Summary</h4>
                {cart?.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-2">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${cart?.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Shipping Address</h4>
                <p className="text-sm text-gray-600">
                  {shippingInfo.address}<br />
                  {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                </p>
              </div>

              {/* Shipping & Returns */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Shipping & Returns</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Free shipping on orders over $75. Standard delivery in 5-7 business days.
                      30-day return policy for unused items.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={step === 1 ? onClose : onPrevious}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {step === 1 ? 'Cancel' : 'Previous'}
            </button>

            {step < 4 ? (
              <button
                onClick={onNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Place Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcommerceMarketplace;