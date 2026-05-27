import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alertDialog';
import '../styles/product.css';

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleAddToCart = async (showAlert = true) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }

    // Validate quantity before sending
    if (quantity > product.num_stocks) {
      console.warn(`[ProductDetails] Quantity ${quantity} exceeds stock ${product.num_stocks}`);
      if (showAlert) {
        showAlert(`Only ${product.num_stocks} item(s) available in stock`, 'Notice');
      }
      return false;
    }

    try {
      console.log(`[ProductDetails] Adding ${quantity} of product ${id} to cart`);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: id,
          quantity: parseInt(quantity)
        })
      });

      const data = await response.json();
      console.log(`[ProductDetails] Response:`, { status: response.status, ok: response.ok, data });

      if (response.ok) {
        if (showAlert) {
          showAlert('Added to cart!', 'Success');
        }
        refreshCartCount();
        setQuantity(1);
        return true;
      } else {
        const errorMsg = data.message || 'Failed to add to cart';
        console.error(`[ProductDetails] Error:`, errorMsg);
        if (showAlert) {
          showAlert(errorMsg, 'Error');
        }
        return false;
      }
    } catch (err) {
      console.error('[ProductDetails] Exception:', err);
      if (showAlert) {
        showAlert('Error adding to cart: ' + err.message, 'Error');
      }
      return false;
    }
  };

  const handleBuyNow = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const success = await handleAddToCart(false);
    if (success) {
      navigate('/appointment');
    } else {
      showAlert('Failed to add item to cart. Please try again.', 'Error');
    }
  };

  if (loading) return <div><Header /><p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p><Footer /></div>;
  if (error) return <div><Header /><p style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</p><Footer /></div>;
  if (!product) return <div><Header /><p style={{ textAlign: 'center', padding: '20px' }}>Product not found</p><Footer /></div>;

  const isOutOfStock = product.num_stocks <= 0;

  return (
    <div>
      <Header />

      <nav className="breadcrumb">
        <a href="/">HOME</a> &nbsp;›&nbsp;
        <span className="active-crumb">PRODUCT DETAILS</span>
      </nav>

      <section className="product-container">
        <div className="product-view-card">
          <div className="product-image-section">
            <img
              src={`http://localhost:5000/uploads/${product.image}`}
              alt={product.product_name}
              className="product-image"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/300')}
            />
          </div>

          <div className="product-details-section">
            <h1>{product.product_name}</h1>
            <p className="product-brand">
              {product.brand_name} — {product.model_name}
            </p>

            <div className="product-stock">
              {isOutOfStock ? (
                <span className="stock-out">Out of Stock</span>
              ) : (
                <span className="stock-available">Stocks: {product.num_stocks}</span>
              )}
            </div>

            <p className="product-description">{product.description || 'No description available'}</p>

            <div className="product-price">₱ {parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="qty-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock || quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.num_stocks}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const maxAllowed = product.num_stocks;
                    setQuantity(Math.max(1, Math.min(value, maxAllowed)));
                  }}
                  disabled={isOutOfStock}
                />
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, product.num_stocks))}
                  disabled={isOutOfStock || quantity >= product.num_stocks}
                >
                  +
                </button>
              </div>
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                Available: {product.num_stocks} item(s)
              </small>
            </div>

            <div className="action-buttons">
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Unavailable' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ProductDetailsPage;
