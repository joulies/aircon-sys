import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications, deleteNotification, deleteAllNotifications, logout as apiLogout } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
        alert('Failed to delete notifications');
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
      alert('Please select notifications to delete');
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
        alert('Failed to delete selected notifications');
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
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
                  <i className="fa fa-bell"></i>
                  <span className="notification-badge">{unreadCount}</span>
                </button>

                {showNotifications && (
                  <div className="notification-popup show">
                    <div className="notification-header">
                      <h4>Notifications</h4>
                      <div className="notification-header-buttons">
                        <button className="notif-action-btn" onClick={handleDeleteAll} title="Delete All">
                          <i className="fa fa-trash"></i>
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
                          <i className="fa fa-trash"></i> Delete Selected
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`dropdown ${showUserDropdown ? 'open' : ''}`} ref={dropdownRef}>
                <button className="drop-btn" onClick={toggleUserDropdown}>
                  {user.fname} {user.lname} <i className="fa fa-caret-down"></i>
                </button>
                <div className="dropdown-content">
                  <button 
                    onClick={() => {
                      navigate('/purchase-history');
                      closeUserDropdown();
                    }}
                  >
                    <i className="fa fa-history"></i> My Purchases
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeUserDropdown();
                    }}
                  >
                    <i className="fa fa-sign-out"></i> Logout
                  </button>
                </div>
              </div>

              <button className="btn-fill" onClick={() => navigate('/cart')}>
                <i className="fa fa-cart-shopping"></i>
                <span className={`cart-badge ${cartCount > 0 ? 'active' : ''}`}>
                  {cartCount}
                </span>
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <button className="btn-login" onClick={() => navigate('/login')}>
                <i className="fa fa-sign-in"></i> Login
              </button>
              <button className="btn-signup" onClick={() => navigate('/signup')}>
                <i className="fa fa-user-plus"></i> Sign Up
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
