import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/cart.css';

function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to load cart');
      const data = await response.json();
      console.log('[CartPage] Cart loaded:', data.items);
      // Verify each item has num_stocks
      data.items?.forEach(item => {
        console.log(`[CartPage] Item ${item.product_id}: stock=${item.num_stocks}, qty=${item.quantity}`);
      });
      setCartItems(data.items || []);
    } catch (err) {
      console.error('[CartPage] Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        loadCart();
      }
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const updateQuantity = async (itemId, newQuantity, maxStock) => {
    console.log(`[CartPage] updateQuantity called: itemId=${itemId}, newQty=${newQuantity}, maxStock=${maxStock}`);
    
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    // Prevent updating beyond available stock
    if (newQuantity > maxStock) {
      console.warn(`[CartPage] Quantity ${newQuantity} exceeds max stock ${maxStock}`);
      alert(`Cannot add more! Only ${maxStock} item(s) available in stock.`);
      return;
    }

    try {
      console.log(`[CartPage] Sending PUT request to update quantity`);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      const data = await response.json();
      console.log(`[CartPage] Update response:`, { status: response.status, ok: response.ok, data });
      
      if (response.ok) {
        console.log(`[CartPage] Update successful, reloading cart`);
        loadCart();
      } else {
        console.error(`[CartPage] Update failed:`, data.message);
        alert(data.message || 'Failed to update quantity');
      }
    } catch (err) {
      console.error('[CartPage] Error updating quantity:', err);
      alert('Error updating quantity: ' + err.message);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  };

  const validateCartBeforeCheckout = () => {
    console.log('[CartPage] Validating cart before checkout');

    // Check if any item is out of stock
    const outOfStockItems = cartItems.filter(item => parseInt(item.num_stocks) <= 0);

    if (outOfStockItems.length > 0) {
      const itemList = outOfStockItems
        .map(item => `${item.product_name}`)
        .join(', ');

      console.error('[CartPage] Out of stock items found:', outOfStockItems);
      alert(`Cannot proceed to checkout. The following items are out of stock:\n\n${itemList}`);
      return false;
    }

    console.log('[CartPage] Cart validation passed');
    return true;
  };

  const handleProceedToCheckout = (e) => {
    console.log('[CartPage] handleProceedToCheckout called');
    
    // STRICT CHECK 1: Cart not empty
    if (!cartItems || cartItems.length === 0) {
      console.error('[CartPage] BLOCKED - Cart is empty');
      alert('Your cart is empty. Please add items before checking out.');
      e?.preventDefault();
      return;
    }

    // STRICT CHECK 2: Validate cart before checkout
    if (!validateCartBeforeCheckout()) {
      console.warn('[CartPage] Cart validation failed, preventing navigation');
      e?.preventDefault();
      return;
    }
    
    // STRICT CHECK 3: No items exceed stock (redundant but explicit)
    const invalidItems = cartItems.filter(item => parseInt(item.quantity) > parseInt(item.num_stocks));
    if (invalidItems.length > 0) {
      console.error('[CartPage] BLOCKED - Items exceed stock:', invalidItems);
      e?.preventDefault();
      return;
    }
    
    console.log('[CartPage] All validations passed, navigating to appointment page');
    navigate('/appointment');
  };

  return (
    <div>
      <Header />
      
      <nav className="breadcrumb">
        <Link to="/">HOME</Link> &nbsp;›&nbsp;
        <span className="active-crumb">MY CART</span>
      </nav>

      <section className="cart-container">
        {loading && <p style={{ textAlign: 'center' }}>Loading cart...</p>}
        {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}
        
        {!loading && !error && cartItems.length === 0 && (
          <p style={{ textAlign: 'center', padding: '20px' }}>Your cart is empty</p>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <>
            <p className="installation-note">
              <i className="fa fa-info-circle"></i> Installation appointment is
              required. You will set your preferred date and time in the next step.
            </p>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="cartBody">
                {cartItems.map((item) => (
                  <tr key={item.id} className="cart-item">
                    <td>
                      <div className="product-cell">
                        <div
                          className="product-img"
                          style={{
                            backgroundImage: `url(http://localhost:5000/uploads/${item.image})`
                          }}
                        ></div>
                        <div className="product-info">
                          <b>{item.product_name}</b>
                          <span className="brand">
                            {item.brand_name} — {item.model_name}
                          </span>
                          {parseInt(item.num_stocks) <= 0 && (
                            <span style={{ display: 'block', color: '#d9534f', fontSize: '12px', marginTop: '4px' }}>
                              <i className="fa fa-times-circle"></i> Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="price-cell">₱ {parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="qty-cell">
                      <div className="qty-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.num_stocks)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          className="qty-input"
                          value={item.quantity}
                          readOnly
                        />
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.num_stocks)}
                          disabled={parseInt(item.quantity) >= parseInt(item.num_stocks)}
                        >
                          +
                        </button>
                      </div>
                      <small style={{ display: 'block', color: '#666', fontSize: '12px', marginTop: '3px' }}>
                        Max: {item.num_stocks}
                      </small>
                    </td>
                    <td className="total-cell">
                      ₱ {(parseFloat(item.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {!loading && !error && cartItems.length > 0 && (
        <div className="checkout-area">
          <div className="checkout-summary">
            <div className="total-line">
              <span>Subtotal:</span>
              <span>₱ {calculateTotal().toFixed(2)}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={(e) => {
                // Double-check validation on click
                const hasOutOfStockItems = cartItems.some(item => parseInt(item.num_stocks) <= 0);
                if (hasOutOfStockItems) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.error('[CartPage] Checkout blocked - items out of stock');
                  alert('Cannot proceed. Please remove out of stock items.');
                  return false;
                }
                handleProceedToCheckout(e);
              }}
              disabled={cartItems.some(item => parseInt(item.num_stocks) <= 0)}
              style={{
                opacity: cartItems.some(item => parseInt(item.num_stocks) <= 0) ? 0.6 : 1,
                cursor: cartItems.some(item => parseInt(item.num_stocks) <= 0) ? 'not-allowed' : 'pointer',
                pointerEvents: cartItems.some(item => parseInt(item.num_stocks) <= 0) ? 'none' : 'auto'
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default CartPage;
