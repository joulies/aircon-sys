const API_BASE_URL = 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// AUTHENTICATION FUNCTIONS

// Signup
export const signup = async (fname, lname, email, contact, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fname, lname, email, contact, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Signup failed');
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Error during signup:', error);
    throw error;
  }
};

// Login
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Get stored user
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get auth token
export const getToken = () => {
  return localStorage.getItem('authToken');
};

// Verify token
export const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error('Token verification failed');
    return await response.json();
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
};

// Request OTP
export const requestOtp = async (userId, email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to request OTP');
    return data;
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
};

// Verify OTP
export const verifyOtp = async (userId, email, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'OTP verification failed');

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Get all products
export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Add to cart
export const addToCart = async (productId, quantity = 1) => {
  try {
    console.log(`[API] addToCart called with product ${productId}, qty ${quantity}`);
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    const data = await response.json();
    console.log(`[API] addToCart response:`, { status: response.status, ok: response.ok, data });
    
    // Return data regardless of status - let caller handle success/failure
    return { ...data, status: response.status, ok: response.ok };
  } catch (error) {
    console.error('[API] addToCart error:', error);
    return { success: false, message: 'Network error: ' + error.message, ok: false };
  }
};

// Get cart count
export const getCartCount = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/count`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch cart count');
    return await response.json();
  } catch (error) {
    console.error('Error fetching cart count:', error);
    throw error;
  }
};

// Get notifications
export const getNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete notification');
    return await response.json();
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/all`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete all notifications');
    return await response.json();
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};
