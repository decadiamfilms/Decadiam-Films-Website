import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import { Modal } from '../../components/ui/Modal';
import { 
  PencilIcon, EnvelopeIcon, CheckIcon, XMarkIcon,
  DocumentTextIcon, TagIcon, SparklesIcon
} from '@heroicons/react/24/outline';

interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  description: string;
  fullContent: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function EmailCustomizationPage() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editContent, setEditContent] = useState('');
  const [includeLogo, setIncludeLogo] = useState(false);

  // Available placeholders for easy insertion
  const placeholders = [
    { key: '{{Name}}', description: 'Customer/Recipient name' },
    { key: '{{CustomerName}}', description: 'Customer company name' },
    { key: '{{QuoteID}}', description: 'Quote reference number' },
    { key: '{{OrderID}}', description: 'Order reference number' },
    { key: '{{InvoiceID}}', description: 'Invoice reference number' },
    { key: '{{POrderID}}', description: 'Purchase order number' },
    { key: '{{DeliveryID}}', description: 'Delivery reference number' },
    { key: '{{Sender}}', description: 'Your name/company name' },
    { key: '{{CompanyName}}', description: 'Your company name' },
    { key: '{{Date}}', description: 'Current date' },
    { key: '{{Amount}}', description: 'Total amount' },
    { key: '{{DueDate}}', description: 'Payment due date' },
    { key: '{{Phone}}', description: 'Your phone number' },
    { key: '{{Email}}', description: 'Your email address' },
    { key: '{{Website}}', description: 'Your website URL' },
    { key: '{{Logo}}', description: 'Your company logo image' }
  ];

  useEffect(() => {
    loadEmailTemplates();
  }, []);

  const loadEmailTemplates = async () => {
    try {
      const savedTemplates = localStorage.getItem('saleskik-email-templates');
      if (savedTemplates) {
        setEmailTemplates(JSON.parse(savedTemplates));
      } else {
        // Create default email templates
        const defaultTemplates: EmailTemplate[] = [
          {
            id: '1',
            type: 'Quotes',
            subject: 'Quote {{QuoteID}} is confirmed',
            description: 'Dear {{Name}}, Please check our quote {{QuoteID}}. We look forward to working with you...',
            fullContent: `Dear {{Name}},

Please check our quote {{QuoteID}} for your recent inquiry.

Quote Details:
- Quote ID: {{QuoteID}}
- Date: {{Date}}
- Total Amount: {{Amount}}

We look forward to working with you on this project. If you have any questions, please don't hesitate to contact us.

Best regards,
{{Sender}}
{{CompanyName}}
Phone: {{Phone}}
Email: {{Email}}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            type: 'Orders',
            subject: 'Order {{OrderID}} is confirmed',
            description: 'Dear {{Name}}, Your order {{OrderID}} has been confirmed and is being processed...',
            fullContent: `Dear {{Name}},

Your order {{OrderID}} has been confirmed and is being processed.

Order Details:
- Order ID: {{OrderID}}
- Date: {{Date}}
- Total Amount: {{Amount}}

We will keep you updated on the progress of your order. Expected delivery will be communicated shortly.

Thank you for your business!

Best regards,
{{Sender}}
{{CompanyName}}
Phone: {{Phone}}
Email: {{Email}}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            type: 'Invoice',
            subject: '{{CompanyName}} invoice {{InvoiceID}}',
            description: 'Dear {{Name}}, Please find attached invoice {{InvoiceID}} for services rendered...',
            fullContent: `Dear {{Name}},

Please find attached invoice {{InvoiceID}} for services rendered.

Invoice Details:
- Invoice ID: {{InvoiceID}}
- Date: {{Date}}
- Amount Due: {{Amount}}
- Due Date: {{DueDate}}

Payment can be made via bank transfer or credit card. Please contact us if you have any questions regarding this invoice.

Best regards,
{{Sender}}
{{CompanyName}}
Phone: {{Phone}}
Email: {{Email}}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '4',
            type: 'Purchase Order',
            subject: 'Purchase Order {{POrderID}} is confirmed',
            description: 'Dear {{Name}}, Purchase Order {{POrderID}} has been confirmed and submitted...',
            fullContent: `Dear {{Name}},

Purchase Order {{POrderID}} has been confirmed and submitted to our procurement team.

Purchase Order Details:
- PO ID: {{POrderID}}
- Date: {{Date}}
- Total Amount: {{Amount}}

We will process this order and keep you informed of delivery schedules.

Best regards,
{{Sender}}
{{CompanyName}}
Phone: {{Phone}}
Email: {{Email}}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '5',
            type: 'Delivery',
            subject: 'Delivery {{DeliveryID}} is confirmed',
            description: 'Dear {{Name}}, Your delivery {{DeliveryID}} has been scheduled and confirmed...',
            fullContent: `Dear {{Name}},

Your delivery {{DeliveryID}} has been scheduled and confirmed.

Delivery Details:
- Delivery ID: {{DeliveryID}}
- Date: {{Date}}
- Scheduled Delivery: {{DueDate}}

Our delivery team will contact you to arrange the most convenient time for delivery.

Best regards,
{{Sender}}
{{CompanyName}}
Phone: {{Phone}}
Email: {{Email}}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '6',
            type: 'Statement',
            subject: 'Statement for {{CustomerName}} is Generated',
            description: 'Dear {{Name}}, Your account statement has been generated and is ready for review...',
            fullContent: `Dear {{Name}},

Your account statement for {{CustomerName}} has been generated and is ready for review.

Statement Details:
- Statement Date: {{Date}}
- Account Balance: {{Amount}}
- Due Date: {{DueDate}}

Please review the attached statement and contact us if you have any questions or discrepancies.

Best regards,
{{Sender}}
{{CompanyName}}
Phone: {{Phone}}
Email: {{Email}}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
        setEmailTemplates(defaultTemplates);
        localStorage.setItem('saleskik-email-templates', JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error('Failed to load email templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditContent(template.fullContent);
    setIncludeLogo(template.fullContent.includes('{{Logo}}'));
    setShowEditModal(true);
  };

  const toggleLogoSignature = (include: boolean) => {
    if (include) {
      // Add logo signature if not present
      if (!editContent.includes('{{Logo}}')) {
        const logoSignature = `\n\n---\n{{Logo}}\n${editContent.includes('{{CompanyName}}') ? '' : '{{CompanyName}}\n'}${editContent.includes('{{Phone}}') ? '' : 'Phone: {{Phone}}\n'}${editContent.includes('{{Email}}') ? '' : 'Email: {{Email}}'}`;
        setEditContent(editContent + logoSignature);
      }
    } else {
      // Remove logo signature
      const updatedContent = editContent
        .replace(/\n\n---\n\{\{Logo\}\}\n.*$/s, '') // Remove everything from --- to end
        .replace(/\{\{Logo\}\}/g, '') // Remove any standalone {{Logo}} placeholders
        .trim();
      setEditContent(updatedContent);
    }
    setIncludeLogo(include);
  };

  const handleSave = () => {
    if (!editingTemplate || !editSubject.trim()) {
      return;
    }

    const updatedTemplates = emailTemplates.map(template =>
      template.id === editingTemplate.id
        ? {
            ...template,
            subject: editSubject.trim(),
            fullContent: editContent.trim(),
            description: editContent.trim().substring(0, 80) + (editContent.trim().length > 80 ? '...' : ''),
            updatedAt: new Date()
          }
        : template
    );

    setEmailTemplates(updatedTemplates);
    localStorage.setItem('saleskik-email-templates', JSON.stringify(updatedTemplates));

    // Reset form
    setEditingTemplate(null);
    setEditSubject('');
    setEditContent('');
    setIncludeLogo(false);
    setShowEditModal(false);
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('email-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = editContent.substring(0, start) + placeholder + editContent.substring(end);
      setEditContent(newContent);
      
      // Reset cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'Quotes': 'bg-blue-100 text-blue-700',
      'Orders': 'bg-purple-100 text-purple-700',
      'Invoice': 'bg-green-100 text-green-700',
      'Purchase Order': 'bg-orange-100 text-orange-700',
      'Delivery': 'bg-teal-100 text-teal-700',
      'Statement': 'bg-red-100 text-red-700'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading email templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UniversalHeader onMenuToggle={() => setShowSidebar(!showSidebar)} />
      <UniversalNavigation
        currentPage="Email Customization"
        userPlan="SMALL_BUSINESS"
        userRole="ADMIN"
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <main className="flex-1 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Manage Email Customization</h1>
                <EnvelopeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Customize email templates to match your branding and communication style. These templates are used 
                when sending automated emails for quotes, orders, invoices, and other business communications to your customers.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Email Templates Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
              <p className="text-sm text-gray-600 mt-1">Click edit to customize any email template</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getTypeColor(template.type)}`}>
                          {template.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-sm">
                          {template.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate" title={template.description}>
                          {template.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(template)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          title="Edit email template"
                        >
                          <PencilIcon className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <SparklesIcon className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Email Template Tips</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Use placeholders like <code className="bg-blue-100 px-1 rounded">&#123;&#123;Name&#125;&#125;</code> to automatically insert customer information</p>
                  <p>• Keep subject lines clear and professional</p>
                  <p>• Include your company branding and contact information</p>
                  <p>• Test your templates by sending sample emails before going live</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Email Template Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
          setEditSubject('');
          setEditContent('');
          setIncludeLogo(false);
        }}
        title="Edit Email Template"
        subtitle="Customize your email template with placeholders and branding"
        size="2xl"
      >
        <div className="px-2 py-4">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                Template Type: {editingTemplate?.type}
              </h4>
              <p className="text-gray-600">
                Customize this email template to match your brand voice and include all necessary information.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                  placeholder="Enter email subject line..."
                  required
                />
              </div>

              {/* Email Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Content
                </label>
                <textarea
                  id="email-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 resize-none font-mono"
                  placeholder="Enter your email content here. Use placeholders like {{Name}} for dynamic content..."
                />
              </div>

              {/* Logo in Signature */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-5 border-2 border-amber-300 shadow-md">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="includeLogo"
                    checked={includeLogo}
                    onChange={(e) => toggleLogoSignature(e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeLogo" className="text-sm font-bold text-amber-900">
                    Include Company Logo in Email Signature
                  </label>
                </div>
                <p className="text-xs text-amber-800 font-medium">
                  {includeLogo ? (
                    <>
                      ✓ Logo signature added! The <code className="bg-amber-100 px-1 rounded">&#123;&#123;Logo&#125;&#125;</code> placeholder 
                      will be replaced with your company logo. Uncheck to remove.
                    </>
                  ) : (
                    <>
                      Check this box to automatically add a professional signature with your company logo and contact details.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right Column - Placeholder Helper */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TagIcon className="w-4 h-4 mr-2 text-gray-600" />
                  Available Placeholders
                </h5>
                <p className="text-xs text-gray-600 mb-4">
                  Click any placeholder to insert it at your cursor position
                </p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {placeholders.map((placeholder) => (
                    <button
                      key={placeholder.key}
                      onClick={() => insertPlaceholder(placeholder.key)}
                      className="w-full text-left p-2 text-xs bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                    >
                      <div className="font-mono font-semibold text-blue-600 group-hover:text-blue-700">
                        {placeholder.key}
                      </div>
                      <div className="text-gray-500 group-hover:text-gray-600">
                        {placeholder.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Section */}
              <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h5 className="font-semibold text-yellow-900 mb-2">Preview Note</h5>
                <p className="text-xs text-yellow-800">
                  Placeholders like <code className="bg-yellow-100 px-1 rounded">&#123;&#123;Name&#125;&#125;</code> will be automatically 
                  replaced with real customer data when emails are sent.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-gray-50 px-1 py-4 rounded-b-lg">
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingTemplate(null);
              setEditSubject('');
              setEditContent('');
            }}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editSubject.trim()}
            className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-4 h-4" />
              <span>Save Template</span>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}