import React, { useState } from 'react';
import {
  XMarkIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  LinkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface EmailPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
}

export function EmailPurchaseOrderModal({ isOpen, onClose, purchaseOrder }: EmailPurchaseOrderModalProps) {
  const [emailType, setEmailType] = useState<'pdf' | 'link'>('pdf');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Initialize email data when modal opens
  React.useEffect(() => {
    if (isOpen && purchaseOrder) {
      const supplierEmail = getSupplierEmail(purchaseOrder.supplierName);
      setRecipientEmail(supplierEmail);
      setSubject(`Purchase Order ${purchaseOrder.poNumber} - ${purchaseOrder.supplierName}`);
      setMessage(getDefaultMessage(emailType, purchaseOrder));
    }
  }, [isOpen, purchaseOrder, emailType]);

  const getSupplierEmail = (supplierName: string) => {
    // Mock supplier email lookup - in production this would come from supplier database
    const supplierEmails: {[key: string]: string} = {
      'Sydney Glass Co': 'orders@sydneyglass.com.au',
      'Hardware Direct': 'purchasing@hardwaredirect.com.au',
      'Building Supplies Ltd': 'orders@buildingsupplies.com.au',
      'Steel Works Ltd.': 'orders@steelworks.com.au',
      'Custom Cabinet Co': 'orders@customcabinets.com.au',
      'Glass & Glazing Pro': 'orders@glassglazingpro.com.au'
    };
    
    return supplierEmails[supplierName] || 'orders@supplier.com.au';
  };

  const getDefaultMessage = (type: 'pdf' | 'link', order: any) => {
    const companyName = 'Ecco Hardware';
    
    if (type === 'pdf') {
      return `Dear ${order.supplierName} Team,

Please find attached Purchase Order ${order.poNumber} for the following items:

${order.orderSummary}

Total Order Value: $${order.totalAmount?.toFixed(2)}
Expected Delivery: ${order.expectedDelivery}

Please confirm receipt of this order and provide delivery confirmation.

Best regards,
${companyName} Procurement Team`;
    } else {
      return `Dear ${order.supplierName} Team,

Please access your Purchase Order ${order.poNumber} using the secure link below:

[INTERACTIVE LINK WILL BE GENERATED]

This link allows you to:
• View complete order details
• Confirm receipt and delivery dates
• Update order status
• Upload delivery documentation

Total Order Value: $${order.totalAmount?.toFixed(2)}
Expected Delivery: ${order.expectedDelivery}

Best regards,
${companyName} Procurement Team`;
    }
  };

  const generateInteractiveLink = (orderId: string) => {
    // Generate secure token (in production this would be properly secured)
    const token = btoa(`${orderId}-${Date.now()}`);
    return `${window.location.origin}/purchase-order/view/${orderId}?token=${token}`;
  };

  const handleSend = async () => {
    setSending(true);
    
    try {
      if (emailType === 'link') {
        // Generate interactive link
        const interactiveLink = generateInteractiveLink(purchaseOrder.id);
        const updatedMessage = message.replace('[INTERACTIVE LINK WILL BE GENERATED]', interactiveLink);
        
        // TODO: Call API to send email with link
        console.log('Sending interactive link email:', {
          to: recipientEmail,
          subject,
          message: updatedMessage,
          link: interactiveLink
        });
      } else {
        // TODO: Call API to send email with PDF attachment
        console.log('Sending PDF email:', {
          to: recipientEmail,
          subject,
          message,
          pdfUrl: `/purchase-order/pdf/${purchaseOrder.id}`
        });
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Purchase Order ${emailType === 'pdf' ? 'PDF' : 'interactive link'} sent successfully to ${recipientEmail}`);
      onClose();
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Email Purchase Order</h2>
            <p className="text-sm text-gray-600 mt-1">{purchaseOrder?.poNumber} to {purchaseOrder?.supplierName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Email Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Email Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setEmailType('pdf')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  emailType === 'pdf' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="font-medium">Send PDF</span>
                </div>
                <p className="text-sm text-gray-600">
                  Email a PDF attachment of the purchase order
                </p>
              </button>

              <button
                onClick={() => setEmailType('link')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  emailType === 'link' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <LinkIcon className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="font-medium">Send Interactive Link</span>
                </div>
                <p className="text-sm text-gray-600">
                  Email a secure link for online viewing and confirmation
                </p>
              </button>
            </div>
          </div>

          {/* Recipient Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="supplier@example.com"
            />
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Interactive Link Preview */}
          {emailType === 'link' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <LinkIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Interactive Link Features</h4>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• View complete purchase order details</li>
                    <li>• Confirm receipt and delivery scheduling</li>
                    <li>• Update order status and progress</li>
                    <li>• Upload delivery documentation</li>
                    <li>• Secure access with token authentication</li>
                  </ul>
                  <div className="mt-3 text-xs text-blue-700">
                    Link: {generateInteractiveLink(purchaseOrder?.id || 'preview')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !recipientEmail || !subject || !message}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Send {emailType === 'pdf' ? 'PDF' : 'Link'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}