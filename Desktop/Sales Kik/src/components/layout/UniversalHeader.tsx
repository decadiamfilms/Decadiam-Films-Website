import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, HomeIcon, UserCircleIcon, CogIcon, 
  ArrowRightOnRectangleIcon, ChevronDownIcon 
} from '@heroicons/react/24/outline';

interface UniversalHeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  actions?: React.ReactNode;
  summaryCards?: React.ReactNode;
}

export function UniversalHeader({ 
  title, 
  subtitle, 
  onMenuToggle, 
  actions,
  summaryCards 
}: UniversalHeaderProps) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Ecco Hardware');
  const [logoStyle, setLogoStyle] = useState<string>('h-12 w-auto max-w-48');

  // Get user info
  const getUserInfo = () => {
    const employeeSession = localStorage.getItem('employee-session');
    if (employeeSession) {
      try {
        const employee = JSON.parse(employeeSession);
        return {
          name: employee.name || 'Employee',
          email: employee.email || '',
          role: employee.role || 'EMPLOYEE',
          isEmployee: true
        };
      } catch (error) {
        return {
          name: 'Employee',
          email: '',
          role: 'EMPLOYEE',
          isEmployee: true
        };
      }
    }
    
    // Default admin user
    return {
      name: 'Adam Budai',
      email: 'adam@eccohardware.com.au',
      role: 'ADMIN',
      isEmployee: false
    };
  };

  const userInfo = getUserInfo();

  // Intelligent logo scaling based on dimensions
  const analyzeLogo = (logoSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      const aspectRatio = naturalWidth / naturalHeight;
      
      let style = '';
      
      if (aspectRatio > 2.5) {
        // Very wide logo (like long company names)
        style = 'h-12 w-auto max-w-72';
      } else if (aspectRatio > 1.5) {
        // Wide logo (landscape)
        style = 'h-14 w-auto max-w-60';
      } else if (aspectRatio < 0.7) {
        // Tall logo (portrait)
        style = 'h-16 w-auto max-w-32';
      } else if (aspectRatio >= 0.7 && aspectRatio <= 1.3) {
        // Square-ish logo
        style = 'h-14 w-auto max-w-44';
      } else {
        // Slightly wide logo
        style = 'h-14 w-auto max-w-52';
      }
      
      // Size boost based on original dimensions
      if (naturalWidth < 200 && naturalHeight < 200) {
        // Small original logo - boost size
        style = style.replace('h-12', 'h-16').replace('h-14', 'h-16');
      } else if (naturalWidth > 800 || naturalHeight > 800) {
        // Large original logo - be more conservative
        style = style.replace('h-16', 'h-14').replace('h-14', 'h-12');
      }
      
      setLogoStyle(style);
    };
    
    img.onerror = () => {
      // Fallback styling if image fails to load
      setLogoStyle('h-14 w-auto max-w-52');
    };
    
    img.src = logoSrc;
  };

  // Load company logo and name
  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setCompanyLogo(savedLogo);
      analyzeLogo(savedLogo);
    }
    
    // In a real app, you'd fetch this from API
    // For now, we'll use localStorage or default
    const savedCompanyName = localStorage.getItem('companyName') || 'Ecco Hardware';
    setCompanyName(savedCompanyName);
  }, []);

  // Re-analyze logo when it changes
  useEffect(() => {
    if (companyLogo) {
      analyzeLogo(companyLogo);
    }
  }, [companyLogo]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    // Clear employee session if exists
    localStorage.removeItem('employee-session');
    localStorage.removeItem('employee-preview');
    
    // Clear regular session
    localStorage.removeItem('accessToken');
    
    // Redirect to login
    navigate('/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* SalesKik Logo */}
            <button
              onClick={() => {
                // Check if employee and redirect accordingly
                const employeeSession = localStorage.getItem('employee-session');
                if (employeeSession) {
                  navigate('/employee-dashboard');
                } else {
                  navigate('/dashboard');
                }
              }}
              className="flex items-center hover:opacity-80 transition-opacity h-16"
              title="Go to Dashboard"
            >
              <img src="/saleskik-logo.png" alt="SalesKik" className="h-40 w-auto" />
            </button>

            {/* Divider */}
            <div className="w-px h-12 bg-gray-300"></div>

            {/* Company Logo/Name */}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center hover:opacity-80 transition-opacity h-16"
              title="Company Settings"
            >
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Company Logo" 
                  className={`${logoStyle} object-contain`}
                  onError={() => setCompanyLogo('')}
                />
              ) : (
                <div className="text-2xl font-bold text-gray-700 px-2">
                  {companyName}
                </div>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {actions}
            
            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">
                    {userInfo.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{userInfo.name}</div>
                  <div className="text-xs text-gray-500">{userInfo.role}</div>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                    <p className="text-xs text-gray-500">{userInfo.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate(userInfo.isEmployee ? '/profile' : '/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CogIcon className="w-4 h-4" />
                    {userInfo.isEmployee ? 'My Profile' : 'Settings'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {summaryCards && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {summaryCards}
          </div>
        )}
      </div>
    </div>
  );
}

export default UniversalHeader;