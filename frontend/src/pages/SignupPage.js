import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup as apiSignup } from '../services/api';
import Dialog from '../components/Dialog';
import logo from '../logo.png';
import '../styles/auth.css';

function SignupPage() {
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, label: '', color: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const calculatePasswordStrength = (password) => {
    if (!password) return { level: 0, label: '', color: '' };

    let strengthLevel = 0;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const length = password.length;

    if (length >= 8) strengthLevel++;
    if (hasUpperCase) strengthLevel++;
    if (hasLowerCase) strengthLevel++;
    if (hasNumbers) strengthLevel++;
    if (hasSpecialChar) strengthLevel++;

    const strengthMap = {
      0: { level: 0, label: 'Weak', color: '#c33' },
      1: { level: 1, label: 'Weak', color: '#c33' },
      2: { level: 2, label: 'Fair', color: '#ff9800' },
      3: { level: 3, label: 'Good', color: '#ffc107' },
      4: { level: 4, label: 'Strong', color: '#4caf50' },
      5: { level: 5, label: 'Very Strong', color: '#2e7d32' },
    };

    return strengthMap[strengthLevel];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    setError('');
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.fname.trim()) errors.push('First name is required');
    if (!formData.lname.trim()) errors.push('Last name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push('Invalid email format');
    if (!formData.contact.trim()) errors.push('Contact number is required');
    else if (formData.contact.length < 10) errors.push('Contact number must be at least 10 digits');
    if (!formData.password) errors.push('Password is required');
    else {
      if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(formData.password)) errors.push('Password must contain at least one uppercase letter');
      if (!/[a-z]/.test(formData.password)) errors.push('Password must contain at least one lowercase letter');
      if (!/\d/.test(formData.password)) errors.push('Password must contain at least one number');
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)) errors.push('Password must contain at least one special character (!@#$%^&* etc)');
    }
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const result = await apiSignup(
        formData.fname,
        formData.lname,
        formData.email,
        formData.contact,
        formData.password
      );

      if (result.success) {
        setDialogOpen(true);
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="logo-link">
        <img src={logo} alt="VA Industrial Electrical Services Logo" className="auth-logo" />
      </Link>
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fname">First Name *</label>
              <input
                type="text"
                id="fname"
                name="fname"
                value={formData.fname}
                onChange={handleChange}
                placeholder="Enter your first name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lname">Last Name *</label>
              <input
                type="text"
                id="lname"
                name="lname"
                value={formData.lname}
                onChange={handleChange}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact Number *</label>
            <input
              type="tel"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="Enter your contact number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
            <div className="password-requirement-note">
              Min 8 chars: uppercase, lowercase, number, special char
            </div>
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div className="strength-fill" style={{ width: `${(passwordStrength.level / 5) * 100}%`, backgroundColor: passwordStrength.color }}></div>
                </div>
                <div className="strength-label" style={{ color: passwordStrength.color }}>
                  Strength: {passwordStrength.label}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>

      <Dialog
        isOpen={dialogOpen}
        title="Account Created"
        message="Account created successfully! Redirecting to login..."
        onClose={() => navigate('/login')}
      />
    </div>
  );
}

export default SignupPage;
