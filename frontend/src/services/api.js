const API_BASE_URL = 'https://aircon-sys.onrender.com';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/* =========================
   AUTHENTICATION
========================= */

// SIGNUP
export const signup = async (fname, lname, email, contact, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'appalication/json'
      },
      body: JSON.stringify({
        fname,
        lname,
        email,
        contact,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    // store token if backend sends it
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// LOGIN
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// LOGOUT
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// GET USER
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// GET TOKEN
export const getToken = () => {
  return localStorage.getItem('authToken');
};

/* =========================
   AUTH VERIFY
========================= */

export const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return data;
  } catch (error) {
    console.error('Verify token error:', error);
    throw error;
  }
};

/* =========================
   OTP
========================= */

export const requestOtp = async (userId, email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OTP request failed');
    }

    return data;
  } catch (error) {
    console.error('OTP request error:', error);
    throw error;
  }
};

export const verifyOtp = async (userId, email, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, email, otp })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  } catch (error) {
    console.error('OTP verify error:', error);
    throw error;
  }
};

/* =========================
   PRODUCTS
========================= */

export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch products error:', error);
    throw error;
  }
};

/* =========================
   CART
========================= */

export const addToCart = async (productId, quantity = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        product_id: productId,
        quantity
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add to cart');
    }

    return data;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
  }
};

export const getCartCount = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/count`, {
      headers: getAuthHeaders()
    });

    return await response.json();
  } catch (error) {
    console.error('Cart count error:', error);
    throw error;
  }
};

/* =========================
   NOTIFICATIONS
========================= */

export const getNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders()
    });

    return await response.json();
  } catch (error) {
    console.error('Notifications error:', error);
    throw error;
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    return await response.json();
  } catch (error) {
    console.error('Delete notification error:', error);
    throw error;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/all`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    return await response.json();
  } catch (error) {
    console.error('Delete all notifications error:', error);
    throw error;
  }
};