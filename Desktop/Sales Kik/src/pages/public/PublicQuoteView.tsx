import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface QuoteOption {
  id: string;
  name: string;
  description: string;
  price: number;
  isSelected: boolean;
}

export default function PublicQuoteView() {
  const { quoteId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Quote data
  const [quoteData, setQuoteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Customer response
  const [customerDecision, setCustomerDecision] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [selectedOptions, setSelectedOptions] = useState<{[category: string]: string}>({});
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuoteData();
  }, [quoteId, token]);

  // Calculate totals with selected options
  const calculateTotalsWithOptions = () => {
    if (!quoteData) return { subtotal: 0, gst: 0, total: 0, optionsTotal: 0 };

    const baseSubtotal = quoteData.totals.subtotal;
    
    // Calculate additional cost from selected options
    let optionsTotal = 0;
    if (quoteData.optionGroups) {
      Object.entries(quoteData.optionGroups).forEach(([category, options]: [string, any[]]) => {
        const selectedOptionName = selectedOptions[category];
        if (selectedOptionName) {
          const selectedOption = options.find(opt => opt.name === selectedOptionName);
          if (selectedOption) {
            optionsTotal += selectedOption.price || 0;
          }
        }
      });
    }

    const newSubtotal = baseSubtotal + optionsTotal;
    const gst = newSubtotal * 0.1;
    const total = newSubtotal + gst;

    return {
      subtotal: newSubtotal,
      gst: gst,
      total: total,
      optionsTotal: optionsTotal
    };
  };

  const loadQuoteData = async () => {
    try {
      // Load quote from database API
      console.log('🔍 Loading public quote:', quoteId, 'with token:', token);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/quotes/${quoteId}${token ? `?token=${token}` : ''}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setQuoteData(result.data);
          setCustomerName(result.data.customer?.name || '');
          setCustomerEmail(result.data.customer?.email || '');
          setLoading(false);
          return;
        }
      }
      
      // Fallback: Load public quotes from localStorage
      const savedPublicQuotes = JSON.parse(localStorage.getItem('saleskik-public-quotes') || '[]');
      const quote = savedPublicQuotes.find((q: any) => q.quoteId === quoteId && q.token === token);

      if (!quote) {
        setError('Quote not found or invalid access link.');
        setLoading(false);
        return;
      }

      // Check if quote is still valid
      const validUntil = new Date(quote.validUntil);
      if (validUntil < new Date()) {
        setError('This quote has expired. Please contact us for an updated quote.');
        setLoading(false);
        return;
      }

      setQuoteData(quote);
      
      // Pre-fill customer details
      setCustomerName(`${quote.customer.primaryContact.firstName} ${quote.customer.primaryContact.lastName}`);
      setCustomerEmail(quote.customer.primaryContact.email || quote.customer.email);
      
    } catch (error) {
      setError('Failed to load quote data.');
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (decision: 'accept' | 'decline') => {
    if (!customerName.trim() || !customerEmail.trim()) {
      alert('Please provide your name and email to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create customer response
      const response = {
        quoteId: quoteData.quoteId,
        decision,
        selectedOptions,
        customerNotes,
        customerName,
        customerEmail,
        responseDate: new Date(),
        ipAddress: 'unknown', // Could be enhanced with IP detection
        userAgent: navigator.userAgent
      };

      // First, save selected options if any
      if (Object.keys(selectedOptions).length > 0) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/quotes/${quoteData.id}/select-options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            selected_options: selectedOptions,
            customer_notes: customerNotes
          })
        });
      }

      // Call API to record response
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/public/quote/${quoteData.quoteId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          decision,
          selectedOptions,
          customerNotes,
          customerName,
          customerEmail
        })
      });

      const result = await apiResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit response');
      }

      // Update local storage
      const savedPublicQuotes = JSON.parse(localStorage.getItem('saleskik-public-quotes') || '[]');
      const updatedQuotes = savedPublicQuotes.map((q: any) => 
        q.quoteId === quoteData.quoteId && q.token === token
          ? { ...q, customerResponse: response, status: decision === 'accept' ? 'accepted' : 'declined' }
          : q
      );
      localStorage.setItem('saleskik-public-quotes', JSON.stringify(updatedQuotes));

      // Update main quotes list for business dashboard
      const savedQuotes = JSON.parse(localStorage.getItem('saleskik-quotes') || '[]');
      const updatedMainQuotes = savedQuotes.map((q: any) => 
        q.quoteId === quoteData.quoteId
          ? { ...q, customerResponse: response, status: decision === 'accept' ? 'accepted' : 'declined', updatedAt: new Date() }
          : q
      );
      localStorage.setItem('saleskik-quotes', JSON.stringify(updatedMainQuotes));

      setCustomerDecision(decision === 'accept' ? 'accepted' : 'declined');

      // Show success message
      if (decision === 'accept') {
        alert('Thank you! Your acceptance has been recorded. We will be in touch shortly to proceed with your order.');
      } else {
        alert('Thank you for your response. We appreciate you taking the time to review our quote.');
      }

    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('Failed to submit your response. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quote Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">Need help? Contact us:</p>
            <p className="text-sm"><strong>Phone:</strong> {quoteData?.companyProfile?.phone || '(000) 000-000'}</p>
            <p className="text-sm"><strong>Email:</strong> {quoteData?.companyProfile?.email || 'info@company.com'}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasExpired = new Date(quoteData.validUntil) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {quoteData.companyProfile?.logo && (
                <img 
                  src={quoteData.companyProfile.logo} 
                  alt="Company Logo" 
                  className="h-12 w-12 object-contain" 
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quote Review</h1>
                <p className="text-gray-600">{quoteData.companyProfile?.name || 'Professional Quote'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">#{quoteData.quoteId}</div>
              <div className="text-sm text-gray-500">
                {hasExpired ? 
                  <span className="text-red-600">Expired</span> : 
                  `Valid until ${new Date(quoteData.validUntil).toLocaleDateString()}`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Quote Status */}
        {customerDecision !== 'pending' && (
          <div className={`mb-6 p-4 rounded-lg ${customerDecision === 'accepted' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-3">
              {customerDecision === 'accepted' ? (
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              ) : (
                <XCircleIcon className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h3 className={`text-lg font-bold ${customerDecision === 'accepted' ? 'text-green-800' : 'text-red-800'}`}>
                  Quote {customerDecision === 'accepted' ? 'Accepted' : 'Declined'}
                </h3>
                <p className={customerDecision === 'accepted' ? 'text-green-700' : 'text-red-700'}>
                  {customerDecision === 'accepted' 
                    ? 'Thank you! We will contact you shortly to proceed with your order.'
                    : 'Thank you for your response. Please contact us if you have any questions.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quote Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5" />
              Quote Details
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Project:</span> {quoteData.projectName}</div>
              <div><span className="font-medium">Reference:</span> {quoteData.referenceNumber || 'N/A'}</div>
              <div><span className="font-medium">Date:</span> {new Date(quoteData.createdAt).toLocaleDateString()}</div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span>Valid until {new Date(quoteData.validUntil).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Delivery
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Method:</span> 
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">
                  {quoteData.deliveryDetails.method}
                </span>
              </div>
              {quoteData.deliveryDetails.address && (
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span>{quoteData.deliveryDetails.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Contact Us
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-gray-500" />
                <a href={`tel:${quoteData.companyProfile?.phone}`} className="text-blue-600 hover:underline">
                  {quoteData.companyProfile?.phone || '(000) 000-000'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                <a href={`mailto:${quoteData.companyProfile?.email}`} className="text-blue-600 hover:underline">
                  {quoteData.companyProfile?.email || 'info@company.com'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6" />
            Items & Services
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {quoteData.jobSections.map((section: any) => 
                  section.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{item.product.name}</div>
                        {item.product.description && (
                          <div className="text-sm text-gray-500 mt-1">{item.product.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">SKU: {item.product.code}</div>
                        {section.name !== 'Main Project' && (
                          <div className="text-xs text-blue-600 font-medium">Job: {section.name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td colSpan={3} className="py-3 px-4 text-right font-bold">Base Subtotal:</td>
                  <td className="py-3 px-4 text-right font-bold">${quoteData.totals.subtotal.toFixed(2)}</td>
                </tr>
                {(() => {
                  const totals = calculateTotalsWithOptions();
                  return (
                    <>
                      {totals.optionsTotal > 0 && (
                        <tr className="bg-amber-50">
                          <td colSpan={3} className="py-3 px-4 text-right font-bold text-amber-800">Options Selected:</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-800">+${totals.optionsTotal.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="py-3 px-4 text-right font-bold">Subtotal:</td>
                        <td className="py-3 px-4 text-right font-bold">${totals.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="py-3 px-4 text-right font-bold">GST (10%):</td>
                        <td className="py-3 px-4 text-right font-bold">${totals.gst.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-blue-50 border-t-2 border-blue-300">
                        <td colSpan={3} className="py-3 px-4 text-right font-bold text-lg">Total:</td>
                        <td className={`py-3 px-4 text-right font-bold text-lg ${totals.optionsTotal > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          ${totals.total.toFixed(2)}
                          {totals.optionsTotal > 0 && (
                            <span className="text-sm text-gray-500 ml-2">(+${totals.optionsTotal.toFixed(2)} options)</span>
                          )}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Options Selection Section */}
        {quoteData.optionGroups && Object.keys(quoteData.optionGroups).length > 0 && customerDecision === 'pending' && !hasExpired && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-amber-900 mb-2">Choose Your Options</h3>
              <p className="text-amber-800">Please select your preferred choice for each category:</p>
            </div>
            
            <div className="space-y-6">
              {Object.entries(quoteData.optionGroups).map(([category, options]) => (
                <div key={category} className="bg-white border border-amber-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 capitalize">{category}:</h4>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <label key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name={`option-${category}`}
                            value={option.name}
                            checked={selectedOptions[category] === option.name}
                            onChange={(e) => setSelectedOptions(prev => ({
                              ...prev,
                              [category]: e.target.value
                            }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{option.name}</div>
                            {option.description && (
                              <div className="text-sm text-gray-600">{option.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="font-semibold text-green-600">
                          {option.price > 0 ? `+$${option.price.toFixed(2)}` : 
                           option.price < 0 ? `-$${Math.abs(option.price).toFixed(2)}` : 
                           'No extra cost'}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Selected Options Summary */}
            {Object.keys(selectedOptions).length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Your Current Selections:</h4>
                <div className="space-y-2">
                  {Object.entries(selectedOptions).map(([category, selectedName]) => {
                    const options = quoteData.optionGroups[category];
                    const selectedOption = options?.find((opt: any) => opt.name === selectedName);
                    return (
                      <div key={category} className="flex justify-between items-center bg-white p-2 rounded border border-green-200">
                        <span className="font-medium text-gray-900 capitalize">{category}: {selectedName}</span>
                        <span className="text-green-600 font-medium">
                          {selectedOption?.price > 0 ? `+$${selectedOption.price.toFixed(2)}` : 'No extra cost'}
                        </span>
                      </div>
                    );
                  })}
                  {(() => {
                    const totals = calculateTotalsWithOptions();
                    return totals.optionsTotal > 0 && (
                      <div className="border-t border-green-300 pt-2 mt-2">
                        <div className="flex justify-between items-center font-bold text-green-800">
                          <span>Total Options Cost:</span>
                          <span>+${totals.optionsTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                💡 <strong>Note:</strong> Your selections will be included in your final quote response.
                You can change your mind before submitting.
              </p>
            </div>
          </div>
        )}

        {/* Customer Response Section */}
        {customerDecision === 'pending' && !hasExpired && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Response</h3>
            
            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Optional Comments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments or Questions (Optional)</label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Any questions, special requirements, or comments..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                rows={4}
              />
            </div>

            {/* Decision Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleResponse('accept')}
                disabled={isSubmitting || !customerName.trim() || !customerEmail.trim()}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
              >
                <CheckCircleIcon className="w-6 h-6" />
                {isSubmitting ? 'Processing...' : 'Accept Quote'}
              </button>
              <button
                onClick={() => handleResponse('decline')}
                disabled={isSubmitting || !customerName.trim() || !customerEmail.trim()}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
              >
                <XCircleIcon className="w-6 h-6" />
                {isSubmitting ? 'Processing...' : 'Decline Quote'}
              </button>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Questions? We're Here to Help</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <PhoneIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Call Us</h4>
              <a 
                href={`tel:${quoteData.companyProfile?.phone}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {quoteData.companyProfile?.phone || '(000) 000-000'}
              </a>
              <p className="text-sm text-gray-500 mt-1">Mon-Fri 8AM-5PM</p>
            </div>
            
            <div className="text-center">
              <EnvelopeIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Email Us</h4>
              <a 
                href={`mailto:${quoteData.companyProfile?.email}?subject=Question about Quote ${quoteData.quoteId}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {quoteData.companyProfile?.email || 'info@company.com'}
              </a>
              <p className="text-sm text-gray-500 mt-1">We reply within 2 hours</p>
            </div>
            
            <div className="text-center">
              <MapPinIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Visit Us</h4>
              <p className="text-gray-700">
                {quoteData.companyProfile?.address || 'Our Business Location'}
              </p>
              <p className="text-sm text-gray-500 mt-1">By appointment</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 p-4">
          <p>This quote was generated by SalesKik Professional Quoting System</p>
        </div>
      </div>
    </div>
  );
}