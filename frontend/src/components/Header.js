import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, deleteNotification, deleteAllNotifications } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alertDialog';
import logo from '../logo.png';

function Header({ userName = 'Guest' }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { cartCount, refreshCartCount } = useCart();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  useEffect(() => {
    if (user) {
      refreshCartCount();
    }
    loadNotifications();
    const notificationInterval = setInterval(loadNotifications, 20000);
    return () => clearInterval(notificationInterval);
  }, [refreshCartCount, user]);

  useEffect(() => {
    // Handle clicking outside dropdown to close it
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const closeUserDropdown = () => {
    setShowUserDropdown(false);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await deleteAllNotifications();
        loadNotifications();
      } catch (error) {
        showAlert('Failed to delete notifications', 'Error');
      }
    }
  };

  const handleCheckboxChange = (id) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) {
      showAlert('Please select notifications to delete', 'Information');
      return;
    }

    if (window.confirm(`Delete ${selectedNotifications.size} notification(s)?`)) {
      try {
        for (const id of selectedNotifications) {
          await deleteNotification(id);
        }
        setSelectedNotifications(new Set());
        loadNotifications();
      } catch (error) {
        showAlert('Failed to delete selected notifications', 'Error');
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Store role before logout clears user data
      const isAdmin = user?.role === 'admin';
      logout();
      // Admin redirects to login, regular users redirect to home
      navigate(isAdmin ? '/login' : '/');
    }
  };

  return (
    <>
      <header className="top-header">
        <img src={logo} alt="VA Industrial Electrical Services Logo" className="header-logo" />
        <div className="text-logo">
          <h2>VA INDUSTRIAL ELECTRICAL SERVICES</h2>
        </div>

        <div className="right-section">
          {user ? (
            <>
              <div className="notification-dropdown">
                <button className="notification-btn" onClick={toggleNotifications}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span className="notification-badge">{unreadCount}</span>
                </button>

                {showNotifications && (
                  <div className="notification-popup show">
                    <div className="notification-header">
                      <h4>Notifications</h4>
                      <div className="notification-header-buttons">
                        <button className="notif-action-btn" onClick={handleDeleteAll} title="Delete All">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                        <span className="close-notification" onClick={toggleNotifications}>×</span>
                      </div>
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className={`notification-item notification-${notif.priority || 'info'}`}>
                            <input 
                              type="checkbox" 
                              className="notification-checkbox"
                              checked={selectedNotifications.has(notif.id)}
                              onChange={() => handleCheckboxChange(notif.id)}
                            />
                            <div className="notification-icon">
                              <i className={`fa ${notif.icon || 'fa-info-circle'}`}></i>
                            </div>
                            <div className="notification-content">
                              <p className="notification-message">{notif.message}</p>
                              <span className="notification-time">
                                {new Date(notif.time).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                          No notifications yet
                        </p>
                      )}
                    </div>
                    <div className="notification-footer">
                      {selectedNotifications.size > 0 && (
                        <button className="notif-delete-selected" onClick={handleDeleteSelected}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg> Delete Selected
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`dropdown ${showUserDropdown ? 'open' : ''}`} ref={dropdownRef}>
                <button className="drop-btn" onClick={toggleUserDropdown}>
                  {user.fname} {user.lname} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline-block', marginLeft: '4px'}}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="dropdown-content">
                  <button
                    onClick={() => {
                      navigate('/purchase-history');
                      closeUserDropdown();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg> My Purchases
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeUserDropdown();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg> Logout
                  </button>
                </div>
              </div>

              <button className="btn-fill" onClick={() => navigate('/cart')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span className={`cart-badge ${cartCount > 0 ? 'active' : ''}`}>
                  {cartCount}
                </span>
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <button className="btn-login" onClick={() => navigate('/login')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg> Login
              </button>
              <button className="btn-signup" onClick={() => navigate('/signup')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <line x1="12" y1="12" x2="12" y2="18"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg> Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="main-nav">
        <Link to="/">HOME</Link>
        <Link to="/about">ABOUT US</Link>
        <Link to="/about#contact-us">CONTACT US</Link>
      </nav>
    </>
  );
}

export default Header;
