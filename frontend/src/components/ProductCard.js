import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function ProductCard({ product, onCartUpdate }) {
  const navigate = useNavigate();
  const { refreshCartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const isOutOfStock = product.num_stocks <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    // Check if user is logged in
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setFeedback('');

    try {
      console.log(`[ProductCard] Adding 1 of product ${product.id}`);
      const response = await addToCart(product.id, 1);
      console.log(`[ProductCard] Response:`, response);
      
      if (response.ok && response.success) {
        setFeedback('Added!');
        refreshCartCount();
        onCartUpdate();
        setTimeout(() => setFeedback(''), 1500);
      } else {
        // Show backend error message
        const errorMsg = response.message || 'Failed to add to cart';
        console.error(`[ProductCard] Error:`, errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('[ProductCard] Exception:', error);
      alert('Error adding to cart: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card product-card">
      <img 
        className="main-product-image" 
        src={`http://localhost:5000/uploads/${product.image}`}
        alt={product.product_name}
        onError={(e) => e.target.src = 'https://via.placeholder.com/140'}
      />
      <p className="product-name-deets">{product.product_name}</p>
      <p className="product-brand">
        {product.brand_name} — {product.model_name}
      </p>
      <p className={`stock-label ${isOutOfStock ? 'red-text' : ''}`}>
        {isOutOfStock ? 'Out of Stock' : `Stocks: ${product.num_stocks}`}
      </p>
      <p className="product-price">₱ {parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

      <button 
        className="add-cart-btn" 
        onClick={handleAddToCart}
        disabled={isOutOfStock || isLoading}
        style={feedback === 'Added!' ? { background: '#28a745' } : {}}
      >
        {feedback || (isLoading ? 'Adding...' : (isOutOfStock ? 'Unavailable' : 'Add to Cart'))}
      </button>
      <button 
        className="buy-btn"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        View Details
      </button>
    </div>
  );
}

export default ProductCard;
