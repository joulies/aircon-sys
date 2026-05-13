import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import ProductSection from '../components/ProductSection';
import Footer from '../components/Footer';
import { fetchProducts, getCartCount } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCartUpdate = async () => {
    // Trigger cart count refresh in Header
    // This will be handled by the Header component's internal state
  };

  return (
    <div>
      <Header />
      <HeroSlider />
      
      {!isAuthenticated && (
        <div className="auth-cta-section">
          <div className="auth-cta-content">
            <h2>Welcome to VA Industrial Electrical Services</h2>
            <p>Sign up or log in to access exclusive products and manage your purchases</p>
            <div className="auth-cta-buttons">
              <button className="cta-btn cta-login" onClick={() => navigate('/login')}>
                <i className="fa fa-sign-in"></i> Login
              </button>
              <button className="cta-btn cta-signup" onClick={() => navigate('/signup')}>
                <i className="fa fa-user-plus"></i> Create Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="categories image-tabs">
        <button className="category active">DAIKIN</button>
        <button className="category">KOLIN</button>
        <button className="category">MIDEA</button>
        <button className="category">HITACHI</button>
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading products...</p>}
      {error && <p style={{ textAlign: 'center', padding: '20px', color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ProductSection products={products} onCartUpdate={handleCartUpdate} />
      )}

      <Footer />
    </div>
  );
}

export default HomePage;
