import React, { useState } from 'react';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import EmailBrandingCustomizer from '../../components/admin/EmailBrandingCustomizer';
import { 
  PaintBrushIcon, SwatchIcon, EnvelopeIcon,
  SparklesIcon, EyeIcon, CogIcon
} from '@heroicons/react/24/outline';

export default function EmailBrandingPage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalNavigation 
        currentPage="admin" 
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <UniversalHeader
        title="Email Branding"
        subtitle="Customize company branding for professional email communications"
        onMenuToggle={() => setShowSidebar(true)}
      />

      <div className="p-6 max-w-none mx-auto">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <PaintBrushIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Professional Email Branding</h2>
                <p className="text-gray-600">
                  Customize logos, colors, signatures, and templates for all purchase order communications
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCustomizer(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium transition-all shadow-sm"
            >
              <CogIcon className="w-5 h-5" />
              Customize Branding
            </button>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Company Logo */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <SwatchIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Company Logo</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Upload and manage your company logo for email headers and signatures
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Automatic resizing</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Multiple format support</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Mobile optimization</span>
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">Brand Colors</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Define your brand color palette for consistent email design
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Auto palette generation</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Accessibility validation</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>CSS custom properties</span>
              </div>
            </div>
          </div>

          {/* Email Signatures */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <EnvelopeIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Email Signatures</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Professional email signatures with contact information and branding
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Dynamic contact info</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Social media links</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Legal disclaimers</span>
              </div>
            </div>
          </div>

          {/* Template Variants */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <EyeIcon className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900">Template Variants</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Choose from professional, minimal, branded, or corporate designs
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live preview</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Mobile responsive</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Accessibility optimized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Branding Applied To</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Purchase Order Emails */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Purchase Order Emails</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Order creation notifications</div>
                <div>• Supplier order delivery</div>
                <div>• Order status updates</div>
                <div>• Completion confirmations</div>
              </div>
            </div>

            {/* Approval Workflows */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Approval Workflows</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Manager approval requests</div>
                <div>• Approval confirmations</div>
                <div>• Rejection notifications</div>
                <div>• Escalation alerts</div>
              </div>
            </div>

            {/* Supplier Communications */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <PaintBrushIcon className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Supplier Communications</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• Order confirmations</div>
                <div>• Delivery reminders</div>
                <div>• Receipt acknowledgments</div>
                <div>• Follow-up notifications</div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-purple-900 mb-4">Professional Email Benefits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-900 mb-2">Brand Consistency</h4>
              <div className="space-y-2 text-sm text-purple-800">
                <div>✓ Consistent visual identity across all communications</div>
                <div>✓ Professional appearance builds supplier trust</div>
                <div>✓ Enhanced company recognition and credibility</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-purple-900 mb-2">Operational Excellence</h4>
              <div className="space-y-2 text-sm text-purple-800">
                <div>✓ Clear call-to-action buttons improve response rates</div>
                <div>✓ Professional signatures provide easy contact access</div>
                <div>✓ Branded templates reduce email customization time</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Email Branding Customizer Modal */}
      <EmailBrandingCustomizer
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        onBrandingUpdated={() => {
          // Refresh any necessary data
          console.log('Email branding updated');
        }}
      />
    </div>
  );
}