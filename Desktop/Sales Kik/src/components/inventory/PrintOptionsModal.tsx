import React, { useState } from 'react';
import {
  XMarkIcon,
  PrinterIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  BookmarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  pinnedOrders: Set<string>;
}

export function PrintOptionsModal({ isOpen, onClose, orders, pinnedOrders }: PrintOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');

  const printOptions = [
    {
      id: 'live_orders',
      title: 'Total Live Orders',
      description: 'All orders that haven\'t been received yet',
      icon: ShoppingCartIcon,
      color: 'blue',
      count: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
      filter: (orders: any[]) => orders.filter(o => !['completed', 'cancelled'].includes(o.status))
    },
    {
      id: 'drafts',
      title: 'Drafts',
      description: 'Draft purchase orders',
      icon: DocumentTextIcon,
      color: 'gray',
      count: orders.filter(o => o.status === 'draft').length,
      filter: (orders: any[]) => orders.filter(o => o.status === 'draft')
    },
    {
      id: 'not_emailed',
      title: 'POs Not Emailed',
      description: 'Orders not yet sent to suppliers',
      icon: EnvelopeIcon,
      color: 'orange',
      count: orders.filter(o => ['draft', 'pending_approval'].includes(o.status)).length,
      filter: (orders: any[]) => orders.filter(o => ['draft', 'pending_approval'].includes(o.status))
    },
    {
      id: 'urgent_orders',
      title: 'Urgent Orders',
      description: 'Pinned orders marked as urgent',
      icon: BookmarkIcon,
      color: 'red',
      count: pinnedOrders.size,
      filter: (orders: any[]) => orders.filter(o => pinnedOrders.has(o.id))
    },
    {
      id: 'urgent_actions',
      title: 'Urgent Actions',
      description: 'Orders needing immediate attention',
      icon: ExclamationTriangleIcon,
      color: 'yellow',
      count: orders.filter(o => o.priority === 'urgent' || o.status === 'pending_approval').length,
      filter: (orders: any[]) => orders.filter(o => o.priority === 'urgent' || o.status === 'pending_approval')
    },
    {
      id: 'archived',
      title: 'Archived Orders',
      description: 'Completed orders',
      icon: CheckCircleIcon,
      color: 'green',
      count: orders.filter(o => o.status === 'completed').length,
      filter: (orders: any[]) => orders.filter(o => o.status === 'completed')
    }
  ];

  const handlePrint = () => {
    if (!selectedOption) {
      alert('Please select a print option');
      return;
    }

    const option = printOptions.find(opt => opt.id === selectedOption);
    if (!option) return;

    const filteredOrders = option.filter(orders);
    
    if (filteredOrders.length === 0) {
      alert(`No orders found for "${option.title}"`);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${option.title} - ${new Date().toLocaleDateString()}</title>
          <style>
            @page { size: landscape; margin: 0.5in; }
            @media print { body { -webkit-print-color-adjust: exact; } }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 15px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              font-size: 9px;
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #ccc; 
              padding: 3px; 
              text-align: left; 
              vertical-align: top;
              word-wrap: break-word;
              overflow: hidden;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
              font-size: 8px;
            }
            .print-header { 
              margin-bottom: 10px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 8px; 
            }
            .print-title { 
              font-size: 14px; 
              font-weight: bold; 
              margin-bottom: 4px; 
            }
            .print-subtitle { 
              font-size: 10px; 
              color: #666; 
              margin-bottom: 2px; 
            }
            .print-date { 
              color: #666; 
              font-size: 8px; 
            }
            .urgent-row { background-color: #fef2f2; }
            .status-badge { 
              padding: 1px 3px; 
              border-radius: 6px; 
              font-size: 7px; 
              font-weight: 500; 
            }
            .status-draft { background-color: #f3f4f6; color: #374151; }
            .status-sent { background-color: #dbeafe; color: #1e40af; }
            .status-viewed { background-color: #fef3c7; color: #92400e; }
            .status-accepted { background-color: #d1fae5; color: #065f46; }
            .status-declined { background-color: #fee2e2; color: #991b1b; }
            .status-completed { background-color: #d1fae5; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="print-title">${option.title}</div>
            <div class="print-subtitle">${option.description}</div>
            <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
            <div class="print-date">Total Orders: ${filteredOrders.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Customer/Ref</th>
                <th>Order Date</th>
                <th>Due Date</th>
                <th>Quantity</th>
                <th>Description</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => {
                const statusClass = `status-${order.status.replace('_', '')}`;
                const receivedCount = order.receivedItemCount || 0;
                const totalCount = order.lineItemCount;
                const receivedFraction = `${receivedCount}/${totalCount}`;
                
                // Parse order summary with visual indicators for clarity
                const parseQuantitiesAndItems = (summary) => {
                  if (!summary) return { quantities: '', items: '' };
                  
                  const items = summary.split(',').map(item => item.trim());
                  const quantities = [];
                  const descriptions = [];
                  
                  items.forEach((item, index) => {
                    const match = item.match(/^(\d+)x\s*(.+)$/);
                    if (match) {
                      // Add bullet point and number for clarity
                      quantities.push('• ' + match[1]);
                      descriptions.push((index + 1) + '. ' + match[2].trim());
                    } else {
                      quantities.push('• 1');
                      descriptions.push((index + 1) + '. ' + item);
                    }
                  });
                  
                  return {
                    quantities: quantities.join('<br>'),
                    items: descriptions.join('<br>')
                  };
                };
                
                const { quantities, items } = parseQuantitiesAndItems(order.orderSummary);
                
                return `
                  <tr class="${pinnedOrders.has(order.id) ? 'urgent-row' : ''}">
                    <td><strong>${order.poNumber}</strong></td>
                    <td>${order.supplierName}</td>
                    <td>${order.customerName || 'N/A'}${order.customerReference ? '<br><small>' + order.customerReference + '</small>' : ''}</td>
                    <td>${order.orderDate}</td>
                    <td>${order.expectedDelivery}</td>
                    <td style="text-align: center;">${quantities}</td>
                    <td>${items}</td>
                    <td><span class="status-badge ${statusClass}">${order.status.replace('_', ' ')}</span></td>
                    <td>${receivedFraction}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 8px;">
            <p>Ecco Hardware - Purchase Orders Report</p>
            <p>This report was generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(tableContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Print Purchase Orders</h2>
            <p className="text-sm text-gray-600 mt-1">Choose which orders to include in your printout</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Print Options */}
          <div className="space-y-3">
            {printOptions.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedOption === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="printOption"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg mr-4 bg-${option.color}-100`}>
                    <Icon className={`w-5 h-5 text-${option.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.title}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold text-${option.color}-600`}>{option.count}</div>
                    <div className="text-xs text-gray-500">orders</div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Preview */}
          {selectedOption && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Print Preview</div>
              <div className="text-sm text-blue-800">
                {(() => {
                  const option = printOptions.find(opt => opt.id === selectedOption);
                  const count = option?.count || 0;
                  return `Will print ${count} order${count !== 1 ? 's' : ''} from "${option?.title}" category`;
                })()}
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
            onClick={handlePrint}
            disabled={!selectedOption}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print Selected
          </button>
        </div>
      </div>
    </div>
  );
}