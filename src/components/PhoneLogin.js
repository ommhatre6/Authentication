import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PhoneLogin.css'; // Create this file for styling

const PhoneLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('send');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendDisabled(false);
    }
  }, [countdown]);

  const formatIndianPhoneNumber = (input) => {
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.length > 0) {
      return `+91${cleaned.substring(0, 10)}`;
    }
    return cleaned;
  };

  const validateIndianPhoneNumber = (number) => {
    const regex = /^\+91[6-9]\d{9}$/;
    return regex.test(number);
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formattedNumber = formatIndianPhoneNumber(phoneNumber);
      
      if (!validateIndianPhoneNumber(formattedNumber)) {
        throw new Error('Please enter a valid Indian phone number (10 digits starting with 6-9)');
      }

      await axios.post('http://localhost:5000/api/send-verification', { 
        phoneNumber: formattedNumber 
      });
      
      setStep('verify');
      setCountdown(30);
      setIsResendDisabled(true);
    } catch (err) {
      setError(err.response?.data?.error || 
              err.message || 
              'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/verify-code', {
        phoneNumber: formatIndianPhoneNumber(phoneNumber),
        code
      });
      
      if (response.data.success) {
        // Store user data and redirect
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/dashboard';
      } else {
        setError(response.data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 
              'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      await axios.post('http://localhost:5000/api/send-verification', { 
        phoneNumber: formatIndianPhoneNumber(phoneNumber) 
      });
      setCountdown(30);
      setIsResendDisabled(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-login-container">
      <div className="phone-login-card">
        <h2>Indian Phone Verification</h2>
        
        {step === 'send' ? (
          <form onSubmit={handleSendCode} className="phone-form">
            <div className="form-group">
              <label htmlFor="phone">Indian Phone Number</label>
              <div className="phone-input-group">
                <span className="country-code">+91</span>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  pattern="[6-9]\d{9}"
                  maxLength="10"
                  required
                  className="phone-input"
                />
              </div>
              <small className="input-hint">Enter 10-digit mobile number starting with 6-9</small>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="verification-form">
            <div className="form-group">
              <label htmlFor="code">OTP Verification</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit OTP"
                pattern="\d{6}"
                maxLength="6"
                required
                className="otp-input"
              />
              <small className="otp-hint">We've sent an OTP to +91{phoneNumber}</small>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className={`verify-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              onClick={handleResendCode}
              disabled={loading || isResendDisabled}
              className={`resend-btn ${isResendDisabled ? 'disabled' : ''}`}
            >
              {isResendDisabled ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
          </form>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default PhoneLogin;