import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { register, clearError } from '../../store/slices/authSlice';
import logo from '/saleskik-logo.png';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      const password = e.target.name === 'password' ? e.target.value : formData.password;
      const confirmPassword = e.target.name === 'confirmPassword' ? e.target.value : formData.confirmPassword;
      
      if (confirmPassword && password !== confirmPassword) {
        setPasswordError('Passwords do not match');
      } else if (password && password.length < 8) {
        setPasswordError('Password must be at least 8 characters');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (!agreedToTerms) {
      return;
    }
    
    try {
      await dispatch(register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
      })).unwrap();
      
      navigate('/login?registered=true');
    } catch (err) {
      // Error is handled in the slice
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(120deg); }
          66% { transform: translateY(30px) rotate(240deg); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        
        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: float 20s ease-in-out infinite;
          opacity: 0.5;
        }
        
        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 24px;
          transform: translateY(0);
          transition: all 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .shimmer-button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #D4A574 0%, #B8935F 100%);
        }
        
        .shimmer-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }
        
        .input-field {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #D4A574;
          box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
          transform: translateY(-2px);
        }
        
        .input-field.error {
          border-color: #ef4444;
        }
        
        .input-field.error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `}</style>

      {/* Left Panel - Branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #5B7FBF 0%, #4A6AA8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Floating orbs */}
        <div className="floating-orb" style={{
          top: '20%',
          right: '20%',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #D4A574, #E8C4A0)',
          opacity: 0.3
        }}></div>
        <div className="floating-orb" style={{
          bottom: '30%',
          left: '20%',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(135deg, #FAF7F0, #FFFFFF)',
          opacity: 0.2,
          animationDelay: '7s'
        }}></div>

        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '3rem',
          maxWidth: '500px',
          animation: 'slideInLeft 0.8s ease-out'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '900',
            marginBottom: '24px',
            letterSpacing: '-1px'
          }}>
            <span style={{ color: 'white' }}>Join </span>
            <span style={{ color: '#D4A574' }}>SALES</span>
            <span style={{ color: 'white' }}>KIK</span>
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            Start your journey to streamlined business operations today
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="feature-card">
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4A574, #B8935F)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  flexShrink: 0
                }}>
                  <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    Complete Solution
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    Everything you need in one platform
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4A574, #B8935F)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  flexShrink: 0
                }}>
                  <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    Get Started in Minutes
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    Quick setup, immediate value
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4A574, #B8935F)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  flexShrink: 0
                }}>
                  <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    24/7 Support
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    We're here whenever you need us
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#FAF7F0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div className="floating-orb" style={{
          top: '10%',
          left: '5%',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(135deg, #D4A574, #E8C4A0)',
        }}></div>
        <div className="floating-orb" style={{
          bottom: '10%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, #5B7FBF, #7A9AD1)',
          animationDelay: '5s'
        }}></div>
        
        <div style={{ 
          maxWidth: '500px',
          width: '100%',
          animation: 'slideInRight 0.8s ease-out',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'inline-block',
              position: 'relative',
              marginBottom: '1rem'
            }}>
              <img 
                src={logo} 
                alt="SalesKik Logo" 
                style={{
                  height: '130px',
                  width: 'auto',
                  filter: 'drop-shadow(0 10px 25px rgba(212, 165, 116, 0.2))'
                }}
              />
            </div>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #D4A574 0%, #B8935F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>Create your account</h1>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>
              Start your free trial today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ 
            background: 'white',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 20px 60px rgba(212, 165, 116, 0.15)',
            border: '1px solid rgba(212, 165, 116, 0.1)'
          }}>
            {error && (
              <div style={{
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                border: '1px solid #fca5a5',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                animation: 'slideInRight 0.3s ease-out'
              }}>
                <svg style={{ width: '20px', height: '20px', marginRight: '10px', color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {/* Name Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>First name</label>
                <div style={{ position: 'relative' }}>
                  <svg style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>Last name</label>
                <div style={{ position: 'relative' }}>
                  <svg style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '6px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>Company name</label>
              <div style={{ position: 'relative' }}>
                <svg style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Acme Corporation"
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '6px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>Work email</label>
              <div style={{ position: 'relative' }}>
                <svg style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="john@acme.com"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '6px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <svg style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <svg style={{ width: '20px', height: '20px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '6px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <svg style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field ${passwordError ? 'error' : ''}`}
                  placeholder="••••••••"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <svg style={{ width: '20px', height: '20px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {passwordError && (
                <p style={{ marginTop: '4px', fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>
                  {passwordError}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '8px',
                    marginTop: '2px',
                    cursor: 'pointer',
                    accentColor: '#D4A574'
                  }}
                />
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  I agree to the{' '}
                  <a href="#" style={{ color: '#D4A574', textDecoration: 'none', fontWeight: '500' }}>
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" style={{ color: '#D4A574', textDecoration: 'none', fontWeight: '500' }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !!passwordError || !agreedToTerms}
              className="shimmer-button"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || !!passwordError || !agreedToTerms ? 'not-allowed' : 'pointer',
                opacity: loading || !!passwordError || !agreedToTerms ? 0.7 : 1,
                transition: 'all 0.3s ease',
                marginBottom: '20px',
                boxShadow: '0 10px 25px rgba(212, 165, 116, 0.25)'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '20px', height: '20px', marginRight: '8px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                Already have an account?{' '}
                <Link to="/login" style={{
                  color: '#D4A574',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}>
                  Sign in instead
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;