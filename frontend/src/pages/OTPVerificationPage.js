import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, requestOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

function OTPVerificationPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const userId = location.state?.userId;
  const email = location.state?.email;

  useEffect(() => {
    if (!userId || !email) {
      navigate('/login');
      return;
    }
  }, [userId, email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(userId, email, otp);

      if (result.success) {
        login(result.user, result.token);
        alert('Email verified successfully! Redirecting to home page...');
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');
    try {
      const result = await requestOtp(userId, email);

      if (result.success) {
        setOtp('');
        setResendTimer(60);
        alert('OTP resent to your email');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Verify Email</h1>
        <p className="otp-subtitle">Enter the 6-digit code sent to {email}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group">
            <label htmlFor="otp">OTP Code *</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength="6"
              inputMode="numeric"
              className="otp-input"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="otp-footer">
          <p>Didn't receive the code?</p>
          <button
            type="button"
            className="resend-button"
            onClick={handleResendOtp}
            disabled={resendLoading || resendTimer > 0}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OTPVerificationPage;
