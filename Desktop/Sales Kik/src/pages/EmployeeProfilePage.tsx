import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../components/layout/UniversalNavigation';
import UniversalHeader from '../components/layout/UniversalHeader';
import PasswordStrengthValidator from '../components/auth/PasswordStrengthValidator';
import TwoFactorSetup from '../components/auth/TwoFactorSetup';
import { 
  UserIcon, EnvelopeIcon, PhoneIcon, ShieldCheckIcon,
  KeyIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'SUPERVISOR';
  department: string;
  position: string;
  hireDate: string;
  isActive: boolean;
  lastLogin?: Date;
  workSchedule: {
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
  };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = () => {
    try {
      const employeeSession = localStorage.getItem('employee-session');
      if (!employeeSession) {
        console.log('No employee session found, redirecting to login');
        navigate('/login');
        return;
      }

      let emp = JSON.parse(employeeSession);
      console.log('Raw employee session data:', emp);
      console.log('Employee name analysis:', { 
        firstName: emp.firstName, 
        lastName: emp.lastName, 
        name: emp.name,
        email: emp.email,
        fullName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        allKeys: Object.keys(emp)
      });
      
      // If the employee session has incomplete data, try to get full data from employee list
      if (!emp.firstName || !emp.lastName) {
        console.log('Employee session missing names, checking employee list...');
        const employees = localStorage.getItem('saleskik-employees');
        if (employees) {
          const employeeList = JSON.parse(employees);
          const fullEmployee = employeeList.find((e: any) => e.id === emp.id || e.email === emp.email);
          if (fullEmployee) {
            console.log('Found complete employee data:', fullEmployee);
            // Update session with complete data
            localStorage.setItem('employee-session', JSON.stringify(fullEmployee));
            setEmployee(fullEmployee);
            emp = fullEmployee; // Use complete data for form
          }
        }
      }
      
      // Final check - what will actually be set as employee state
      console.log('Setting employee state to:', emp);
      console.log('Employee email will be:', emp.email);
      console.log('Employee first name will be:', emp.firstName);
      
      setEmployee(emp);
      
      // Update browser tab title with employee name
      const employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
      document.title = `${employeeName} - My Profile | SalesKik`;
      console.log('Set document title to:', document.title);
      
      setFormData({
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        email: emp.email || '',
        phone: emp.phone || '',
        department: emp.department || ''
      });
    } catch (error) {
      console.error('Error loading employee data:', error);
      navigate('/login');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Update employee in localStorage
      const employeeSession = localStorage.getItem('employee-session');
      const employees = localStorage.getItem('saleskik-employees');
      
      if (employeeSession && employees) {
        const currentEmployee = JSON.parse(employeeSession);
        const employeeList = JSON.parse(employees);
        
        // Update current employee data
        const updatedEmployee = {
          ...currentEmployee,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          department: formData.department,
          updatedAt: new Date().toISOString()
        };
        
        // Update in employee list
        const updatedList = employeeList.map((emp: any) => 
          emp.id === currentEmployee.id ? updatedEmployee : emp
        );
        
        localStorage.setItem('employee-session', JSON.stringify(updatedEmployee));
        localStorage.setItem('saleskik-employees', JSON.stringify(updatedList));
        
        setEmployee(updatedEmployee);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd validate the current password against a hash
      // For demo purposes, we'll just check against the stored password
      const employeeSession = localStorage.getItem('employee-session');
      const employees = localStorage.getItem('saleskik-employees');
      
      if (employeeSession && employees) {
        const currentEmployee = JSON.parse(employeeSession);
        const employeeList = JSON.parse(employees);
        
        // Check current password
        if (currentEmployee.password !== passwordData.currentPassword) {
          setMessage({ type: 'error', text: 'Current password is incorrect.' });
          setLoading(false);
          return;
        }
        
        // Update password
        const updatedEmployee = {
          ...currentEmployee,
          password: passwordData.newPassword,
          updatedAt: new Date().toISOString()
        };
        
        // Update in employee list
        const updatedList = employeeList.map((emp: any) => 
          emp.id === currentEmployee.id ? updatedEmployee : emp
        );
        
        localStorage.setItem('employee-session', JSON.stringify(updatedEmployee));
        localStorage.setItem('saleskik-employees', JSON.stringify(updatedList));
        
        setEmployee(updatedEmployee);
        setShowPasswordChange(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setMessage({ type: 'success', text: 'Password changed successfully!' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!employee) {
    return <div className="p-8">Loading employee data...</div>;
  }

  console.log('Rendering profile with employee:', employee);
  console.log('Form data state:', formData);

  return (
    <div className="min-h-screen bg-gray-50" style={{ isolation: 'isolate' }}>
      <UniversalNavigation 
        currentPage="profile"
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)}
        onOpen={() => setShowSidebar(true)}
      />
      
      <div className={`transition-all duration-300 ${showSidebar ? 'lg:ml-64' : ''}`}>
        <UniversalHeader 
          title={`${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || 'My Profile'}
          subtitle={`${employee?.position || 'Employee'} • ${employee?.department || 'General'} Department`}
          onMenuClick={() => setShowSidebar(!showSidebar)}
        />
        
        <div className="p-6">
          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckIcon className="w-5 h-5 mr-2" />
                ) : (
                  <XMarkIcon className="w-5 h-5 mr-2" />
                )}
                {message.text}
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Profile Information
                </h2>
                <button
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {employee.firstName || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {employee.lastName || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {employee.email} (Cannot be changed)
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {employee.phone || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Sales, Support, Operations"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {employee.department || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {employee.position || 'Employee'} (Set by administrator)
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {employee.role || 'EMPLOYEE'} (Set by administrator)
                  </p>
                </div>

                {/* Hire Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadEmployeeData(); // Reset form data
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>


            {/* Employment Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Employment Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {employee?.id || 'Not assigned'}
                  </p>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      employee?.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Last Login */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Login
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {employee?.lastLogin 
                      ? new Date(employee.lastLogin).toLocaleDateString() + ' at ' + new Date(employee.lastLogin).toLocaleTimeString()
                      : 'Never'
                    }
                  </p>
                </div>

                {/* Created Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Created
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {employee?.createdAt 
                      ? new Date(employee.createdAt).toLocaleDateString()
                      : 'Not available'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Security Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <KeyIcon className="w-5 h-5" />
                Security Settings
              </h2>

              {!showPasswordChange ? (
                <div className="space-y-4">
                  {/* Password Management */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <h3 className="font-medium text-gray-900">Password</h3>
                      <p className="text-sm text-gray-600">Last changed: {new Date().toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                        {twoFactorEnabled ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Enabled</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Disabled</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {twoFactorEnabled 
                          ? 'Your account is protected with 2FA' 
                          : 'Add extra security to your account'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (twoFactorEnabled) {
                          // Handle 2FA disable
                          setMessage({ type: 'info', text: '2FA disable feature coming soon' });
                        } else {
                          setShowTwoFactorSetup(true);
                        }
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        twoFactorEnabled
                          ? 'text-red-600 border-red-200 hover:bg-red-50'
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                  
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <PasswordStrengthValidator password={passwordData.newPassword} />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleChangePassword}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Setup Modal */}
      {showTwoFactorSetup && (
        <TwoFactorSetup
          userEmail={employee?.email || ''}
          onSetupComplete={(success) => {
            setShowTwoFactorSetup(false);
            if (success) {
              setTwoFactorEnabled(true);
              setMessage({ type: 'success', text: 'Two-Factor Authentication enabled successfully!' });
            }
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}
    </div>
  );
};

export default EmployeeProfilePage;