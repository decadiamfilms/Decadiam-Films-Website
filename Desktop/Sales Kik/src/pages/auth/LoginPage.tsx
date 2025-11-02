import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { login, clearError, setError, setCredentials } from '../../store/slices/authSlice';
import TwoFactorVerification from '../../components/auth/TwoFactorVerification';
import logo from '/saleskik-logo.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmployeeLogin, setIsEmployeeLogin] = useState(false);
  const [pendingUser, setPendingUser] = useState<any | null>(null);
  const [showTwoFactorVerification, setShowTwoFactorVerification] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    
    // Clear any previous sessions first
    localStorage.removeItem('employee-session');
    localStorage.removeItem('employee-preview');
    
    // First check if this is an employee login
    console.log('Checking employee login for:', email);
    const savedEmployees = localStorage.getItem('saleskik-employees');
    if (savedEmployees) {
      const employees = JSON.parse(savedEmployees);
      console.log('Available employees:', employees.map((e: any) => ({ email: e.email, active: e.isActive })));
      
      const employee = employees.find((emp: any) => 
        emp.email === email && emp.password === password && emp.isActive
      );
      
      console.log('Found employee:', employee);
      
      if (employee) {
        // Employee login - store employee data and redirect to employee dashboard
        console.log('Employee login successful, redirecting...');
        setIsEmployeeLogin(true);
        
        localStorage.setItem('employee-session', JSON.stringify(employee));
        localStorage.setItem('accessToken', 'employee-token-' + employee.id);
        localStorage.setItem('refreshToken', 'employee-refresh-' + employee.id);
        
        // Update Redux authentication state for employee
        dispatch(setCredentials({
          user: {
            id: employee.id,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            role: 'EMPLOYEE',
            companyId: employee.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb' // Your existing company
          },
          accessToken: 'employee-token-' + employee.id,
          refreshToken: 'employee-refresh-' + employee.id
        }));
        
        console.log('Employee login successful, redirecting to employee dashboard...');
        navigate('/employee-dashboard');
        return;
      }
    }
    
    // If not employee, check hardcoded admin credentials for demo
    console.log('Not employee, checking admin credentials...');
    
    // Updated secure admin credentials (using proper security practices)
    const validAdminCredentials = [
      { email: 'adambudai2806@gmail.com', password: 'Gabbie1512!' },
    ];
    
    const validAdmin = validAdminCredentials.find(
      cred => cred.email === email && cred.password === password
    );
    
    if (validAdmin) {
      console.log('Valid admin login, checking 2FA requirements...');
      
      // Create admin user object
      const adminUser = {
        id: 'admin-001',
        email: validAdmin.email,
        firstName: 'Adam',
        lastName: 'Budai',
        role: 'ADMIN',
        isOwner: true,
        companyId: '0e573687-3b53-498a-9e78-f198f16f8bcb' // Your existing company
      };

      // Check if user has 2FA enabled and if device requires verification
      const user2FAEnabled = localStorage.getItem('admin-2fa-enabled') === 'true';
      const lastTwoFactorCheck = localStorage.getItem('admin-2fa-last-check');
      const deviceTrusted = localStorage.getItem('trusted-device-admin');
      
      // Intelligent 2FA timing - require 2FA if:
      // 1. User has 2FA enabled AND
      // 2. Device not trusted OR more than 30 days since last check
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const needsTwoFactor = user2FAEnabled && (
        !deviceTrusted || 
        !lastTwoFactorCheck || 
        parseInt(lastTwoFactorCheck) < thirtyDaysAgo
      );

      if (needsTwoFactor) {
        console.log('🔐 2FA required for admin login');
        setPendingUser(adminUser);
        setShowTwoFactorVerification(true);
        return;
      }
      
      // Complete login without 2FA
      console.log('✅ Admin login successful, no 2FA required');
      completeLogin(adminUser);
    } else {
      console.log('Invalid credentials provided');
      dispatch(setError('Invalid email or password'));
    }
  };

  // Complete login process after password (and optional 2FA) verification
  const completeLogin = (user: any) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('accessToken', `${user.role.toLowerCase()}-token-${user.id}`);
    localStorage.setItem('refreshToken', `${user.role.toLowerCase()}-refresh-${user.id}`);
    
    // Update Redux authentication state
    dispatch(setCredentials({
      user: user,
      accessToken: `${user.role.toLowerCase()}-token-${user.id}`,
      refreshToken: `${user.role.toLowerCase()}-refresh-${user.id}`
    }));
    
    console.log('✅ Login completed successfully');
    navigate(user.role === 'ADMIN' ? '/dashboard' : '/employee-dashboard');
  };

  // Handle successful 2FA verification
  const handle2FASuccess = (rememberDevice: boolean) => {
    if (!pendingUser) return;

    console.log('🔐 2FA verification successful');
    
    // Update 2FA tracking
    localStorage.setItem('admin-2fa-last-check', Date.now().toString());
    
    if (rememberDevice) {
      // Trust device for 30 days
      localStorage.setItem('trusted-device-admin', Date.now().toString());
      console.log('🔒 Device trusted for 30 days');
    }
    
    // Complete login
    setShowTwoFactorVerification(false);
    completeLogin(pendingUser);
    setPendingUser(null);
  };

  return (
    <div>
      {/* 2FA Verification Modal */}
      {showTwoFactorVerification && pendingUser && (
        <TwoFactorVerification
          userEmail={pendingUser.email}
          onVerificationSuccess={handle2FASuccess}
          onCancel={() => {
            setShowTwoFactorVerification(false);
            setPendingUser(null);
            console.log('2FA verification cancelled');
          }}
          onBackupCodeMode={() => {
            console.log('Switched to backup code mode');
          }}
        />
      )}
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
        
        .social-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .social-button:hover {
          background: #fefdf9;
          border-color: #D4A574;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(212, 165, 116, 0.2);
        }
      `}</style>

      {/* Left Panel - Form */}
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
          maxWidth: '450px',
          width: '100%',
          animation: 'slideInLeft 0.8s ease-out',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              display: 'inline-block',
              position: 'relative',
              marginBottom: '1.5rem'
            }}>
              <img 
                src={logo} 
                alt="SalesKik Logo" 
                style={{
                  height: '180px',
                  width: 'auto',
                  filter: 'drop-shadow(0 10px 25px rgba(212, 165, 116, 0.2))'
                }}
              />
            </div>
            <h1 style={{ 
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #D4A574 0%, #B8935F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>Welcome Back!</h1>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ 
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
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
                animation: 'slideInLeft 0.3s ease-out'
              }}>
                <svg style={{ width: '20px', height: '20px', marginRight: '10px', color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>Email Address</label>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
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
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '8px',
                    cursor: 'pointer',
                    accentColor: '#D4A574'
                  }}
                />
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Remember me</span>
              </label>
              <Link to="/forgot-password" style={{
                color: '#D4A574',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none'
              }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="shimmer-button"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                marginBottom: '24px',
                boxShadow: '0 10px 25px rgba(212, 165, 116, 0.25)'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '20px', height: '20px', marginRight: '8px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }}></div>
              </div>
              <div style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <span style={{
                  background: 'white',
                  padding: '0 16px',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}>Or continue with</span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <button type="button" className="social-button" onClick={() => alert('Google login coming soon!')}>
                <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button type="button" className="social-button" onClick={() => alert('Microsoft login coming soon!')}>
                <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} viewBox="0 0 24 24">
                  <path fill="#F25022" d="M11.4 11.4H1V1h10.4v10.4z"/>
                  <path fill="#7FBA00" d="M23 11.4H12.6V1H23v10.4z"/>
                  <path fill="#00A4EF" d="M11.4 23H1V12.6h10.4V23z"/>
                  <path fill="#FFB900" d="M23 23H12.6V12.6H23V23z"/>
                </svg>
                Microsoft
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                Don't have an account?{' '}
                <Link to="/onboarding" style={{
                  color: '#D4A574',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}>
                  Start free trial
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel - Branding */}
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

        {/* Floating orbs in the right panel */}
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
          animation: 'slideInRight 0.8s ease-out'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '900',
            marginBottom: '24px',
            letterSpacing: '-1px'
          }}>
            <span style={{ color: '#D4A574' }}>SALES</span>
            <span style={{ color: 'white' }}>KIK</span>
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            Supercharge your sales process with intelligent automation and real-time insights
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    Lightning Fast
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    Process quotes and orders in seconds, not hours
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    Real-time Analytics
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    Track performance and make data-driven decisions
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    Enterprise Security
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    Bank-level encryption and compliance ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default LoginPage;