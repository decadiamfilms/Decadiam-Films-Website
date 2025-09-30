import React from 'react';
import { DevicePhoneMobileIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function MobileNotSupported() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* App Icon */}
          <div className="w-20 h-20 bg-amber-50 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="/saleskik-app-icon.png"
              alt="SalesKik App Icon"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Mobile Icon */}
          <DevicePhoneMobileIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          
          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Mobile Not Supported
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            SalesKik is optimized for desktop and tablet use. For the best mobile experience, please download our dedicated mobile app.
          </p>
          
          {/* Download Buttons */}
          <div className="space-y-4">
            <button className="w-full bg-black text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download SalesKik App
              <span className="text-sm text-gray-300">iOS & Android</span>
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Or continue on a larger device</p>
              <div className="flex justify-center gap-4 text-xs text-gray-400">
                <span>💻 Desktop</span>
                <span>📱 Tablet</span>
                <span>🖥️ Laptop</span>
              </div>
            </div>
          </div>
          
          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">SalesKik Mobile App Features:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div>✓ Product Catalog</div>
              <div>✓ Inventory Management</div>
              <div>✓ Sales Dashboard</div>
              <div>✓ Mobile Orders</div>
              <div>✓ Customer Management</div>
              <div>✓ Reports & Analytics</div>
            </div>
          </div>
          
          {/* Company Info */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              © 2025 SalesKik • Professional Sales Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}