// Purchase Order Template - Based on QuoteTemplate structure
export const generatePurchaseOrderTemplate = (orderData: any, globalStyling: any, companyProfile: any, pdfSettings: any, templateSettings?: any) => {
  // Get template settings from localStorage if not provided
  const activeTemplate = templateSettings || (() => {
    try {
      const activeTemplateId = localStorage.getItem('saleskik-active-template');
      const savedTemplates = localStorage.getItem('saleskik-form-templates');
      
      if (savedTemplates && activeTemplateId) {
        const templates = JSON.parse(savedTemplates);
        const template = templates.find((t: any) => t.id === activeTemplateId);
        console.log('Purchase Order Template - Active template:', template);
        return template;
      }
    } catch (error) {
      console.error('Error loading template settings:', error);
    }
    return null;
  })();
  // Generate expected delivery date
  const expectedDeliveryDate = orderData.expectedDelivery ? new Date(orderData.expectedDelivery) : new Date();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order ${orderData.poNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=${globalStyling.fontFamily || 'Inter'}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: '${globalStyling.fontFamily || 'Inter'}', sans-serif;
            background: #f8fafc;
            padding: 10px;
            line-height: 1.3;
            font-size: 12px;
        }
        
        .document-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 16px;
            border-bottom: 2px solid ${activeTemplate?.primaryColor || globalStyling.primaryColor || '#10b981'};
        }
        
        .header-content {
            display: grid;
            grid-template-columns: 320px 1fr 200px;
            gap: 20px;
            align-items: start;
        }
        
        .company-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        
        .company-logo {
            width: ${globalStyling.logoSize || 300}px;
            height: ${globalStyling.logoSize || 180}px;
            background: linear-gradient(135deg, ${activeTemplate?.primaryColor || globalStyling.primaryColor || '#10b981'} 0%, ${activeTemplate?.secondaryColor || globalStyling.secondaryColor || '#059669'} 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 18px;
            letter-spacing: -0.5px;
            box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
            margin-bottom: 8px;
        }
        
        .logo-image {
            width: ${globalStyling.logoSize || 300}px;
            height: ${globalStyling.logoSize || 180}px;
            object-fit: contain;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        
        .company-details h2 {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2px;
            line-height: 1.2;
        }
        
        .company-details p {
            font-size: 11px;
            color: #475569;
            margin-bottom: 1px;
            line-height: 1.3;
        }
        
        .company-contact {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            margin-top: 58px;
        }
        
        .company-contact p {
            font-size: 12px;
            color: #475569;
            margin-bottom: 2px;
        }
        
        .document-details {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-top: 20px;
        }
        
        .document-type {
            font-size: 28px;
            font-weight: 700;
            color: ${activeTemplate?.primaryColor || globalStyling.primaryColor || '#10b981'};
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .document-number {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
        }
        
        .document-date {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 2px;
        }
        
        .reference-number {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
        }
        
        .main-content {
            padding: 20px;
        }
        
        .section {
            margin-bottom: 24px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid ${activeTemplate?.primaryColor || globalStyling.primaryColor || '#10b981'};
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        
        .info-block {
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .info-block h3 {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .info-block p {
            font-size: 13px;
            color: #334155;
            margin-bottom: 3px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .items-table thead {
            background: linear-gradient(135deg, ${activeTemplate?.primaryColor || globalStyling.primaryColor || '#10b981'} 0%, ${activeTemplate?.secondaryColor || globalStyling.secondaryColor || '#059669'} 100%);
        }
        
        .items-table th {
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
        }
        
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
            color: #334155;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:hover {
            background: #f8fafc;
        }
        
        .text-right {
            text-align: right;
        }
        
        .font-medium {
            font-weight: 500;
        }
        
        .item-description {
            font-size: 11px;
            color: #64748b;
            margin-top: 3px;
        }
        
        .totals {
            margin-top: 16px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            min-width: 250px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
        }
        
        .totals-row:last-child {
            border-bottom: 2px solid ${activeTemplate?.primaryColor || globalStyling.primaryColor || '#10b981'};
            border-top: 2px solid ${activeTemplate?.primaryColor || globalStyling.primaryColor || '#10b981'};
            padding: 10px 12px;
            font-weight: 600;
            font-size: 15px;
            color: #1e293b;
            margin-top: 6px;
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 4px;
        }
        
        .totals-label {
            color: #64748b;
            font-weight: 400;
        }
        
        .totals-value {
            font-weight: 500;
            color: #1e293b;
        }
        
        .terms-content {
            background: #f8fafc;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            margin-top: 12px;
        }
        
        .terms-content h3 {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .terms-content p {
            font-size: 12px;
            color: #475569;
            margin-bottom: 6px;
            line-height: 1.4;
        }
        
        .footer {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 16px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 2px;
        }
        
        .urgent-banner {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .urgent-banner h3 {
            font-size: 16px;
            font-weight: 700;
            color: #dc2626;
            margin-bottom: 4px;
        }
        
        .urgent-banner p {
            font-size: 13px;
            color: #7f1d1d;
        }
        
        @media print {
            body { 
                background: white !important; 
                padding: 0 !important; 
            }
            .document-container { 
                box-shadow: none !important; 
                border-radius: 0 !important; 
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    ${globalStyling.showLogo !== false ? (
                        companyProfile?.logo ? `
                            <img src="${companyProfile.logo}" alt="Company Logo" class="logo-image" style="width: 300px !important; height: 180px !important; max-width: 300px !important; max-height: 180px !important;" />
                        ` : `
                            <div class="company-logo">${(companyProfile?.companyName || companyProfile?.name || 'C').charAt(0)}</div>
                        `
                    ) : ''}
                    ${globalStyling.showCompanyName !== false ? `
                    <div class="company-details">
                        <h2>${companyProfile?.companyName || companyProfile?.name || 'Your Company'}</h2>
                        ${companyProfile?.address ? `<p>${companyProfile.address}</p>` : ''}
                    </div>
                    ` : ''}
                </div>
                <div class="company-contact">
                    ${companyProfile?.abn ? `<p><strong>ABN:</strong> ${companyProfile.abn}</p>` : ''}
                    ${companyProfile?.phone ? `<p><strong>Phone:</strong> ${companyProfile.phone}</p>` : ''}
                    ${companyProfile?.email ? `<p><strong>Email:</strong> ${companyProfile.email}</p>` : ''}
                </div>
                <div class="document-details">
                    <div class="document-type">Purchase Order</div>
                    <div class="document-number">#${orderData.poNumber}</div>
                    <div class="document-date">Date: ${new Date().toLocaleDateString()}</div>
                    ${orderData.referenceNumber ? `<div class="reference-number">Ref: ${orderData.referenceNumber}</div>` : ''}
                </div>
            </div>
        </div>
        
        <!-- Urgent Priority Banner -->
        ${orderData.priority === 'urgent' ? `
        <div class="urgent-banner">
            <h3>🔴 URGENT PURCHASE ORDER</h3>
            <p>This order requires immediate attention and expedited processing</p>
        </div>
        ` : ''}
        
        <!-- Main Content -->
        <div class="main-content">
            
            <!-- Products & Services -->
            ${!pdfSettings.hideItems ? `
            <div class="section">
                <h2 class="section-title">Items & Services</h2>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-right">Qty</th>
                            ${!pdfSettings.hideItemPrice ? '<th class="text-right">Rate</th>' : ''}
                            ${!pdfSettings.hideTotalPrice ? '<th class="text-right">Amount</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${orderData.lineItems.map((item, index) => `
                            <tr>
                                <td>
                                    <div class="font-medium">${item.product.name}</div>
                                    ${!pdfSettings.hideDescription ? `
                                    <div class="item-description">
                                        ${item.product.code ? `<span style="color: #6b7280; font-weight: 500;">SKU:</span> ${item.product.code}` : ''}
                                        ${item.customModuleFlag ? '<span style="color: #7c3aed; font-weight: 600; background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 11px;">CUSTOM GLASS ITEM</span>' : ''}
                                        ${item.jobName && item.jobName !== 'Main Order' ? `<span style="color: #059669; font-weight: 500;"> • Job:</span> ${item.jobName}` : ''}
                                        ${item.product.description ? `<br><div style="color: #374151; font-style: italic; font-size: 12px; line-height: 1.4; margin-top: 4px;">${item.product.description}</div>` : ''}
                                    </div>
                                    ` : ''}
                                </td>
                                <td class="text-right">${item.quantity}</td>
                                ${!pdfSettings.hideItemPrice ? `<td class="text-right">$${item.unitCost.toFixed(2)}</td>` : ''}
                                ${!pdfSettings.hideTotalPrice ? `<td class="text-right font-medium">$${item.totalCost.toFixed(2)}</td>` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="totals-table">
                        <div class="totals-row">
                            <span class="totals-label">Subtotal:</span>
                            <span class="totals-value">$${orderData.totals?.subtotal?.toFixed(2) || orderData.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="totals-row">
                            <span class="totals-label">GST (10%):</span>
                            <span class="totals-value">$${orderData.totals?.gst?.toFixed(2) || (orderData.totalAmount * 0.1)?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="totals-row">
                            <span>Total:</span>
                            <span>$${orderData.totals?.total?.toFixed(2) || (orderData.totalAmount * 1.1)?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            
            <!-- Delivery Details -->
            ${orderData.deliveryDetails || orderData.deliveryAddress ? `
            <div class="section">
                <h2 class="section-title">Delivery Details</h2>
                <div class="two-column">
                    <div class="info-block">
                        <h3>Delivery Address</h3>
                        ${orderData.deliveryDetails ? `
                            <p>${orderData.deliveryDetails.streetAddress}</p>
                            <p>${orderData.deliveryDetails.suburb}, ${orderData.deliveryDetails.state} ${orderData.deliveryDetails.postcode}</p>
                            ${orderData.deliveryDetails.contactPerson ? `<p><strong>Contact:</strong> ${orderData.deliveryDetails.contactPerson}</p>` : ''}
                            ${orderData.deliveryDetails.contactPhone ? `<p><strong>Phone:</strong> ${orderData.deliveryDetails.contactPhone}</p>` : ''}
                        ` : `
                            <div style="white-space: pre-line; line-height: 1.5;">${orderData.deliveryAddress}</div>
                        `}
                    </div>
                    <div class="info-block">
                        <h3>Delivery Instructions</h3>
                        <p>• Delivery during business hours only (8:00 AM - 5:00 PM)</p>
                        <p>• 24-hour advance notice required</p>
                        <p>• Contact site manager upon arrival</p>
                        <p>• Reference PO Number: <strong>${orderData.poNumber}</strong></p>
                        ${orderData.expectedDelivery ? `<p>• Expected Delivery: <strong>${new Date(orderData.expectedDelivery).toLocaleDateString()}</strong></p>` : ''}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>${companyProfile?.companyName || companyProfile?.name || 'Your Company'}</strong> - Professional Purchase Order</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>This is an official purchase order document. Please retain for your records.</p>
        </div>
    </div>
</body>
</html>`;
};

// Helper function to generate PO number with 6 random digits
export const generatePONumber = (): string => {
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PO-${randomNum}`;
};

// Helper function to calculate totals
export const calculatePurchaseOrderTotals = (lineItems: any[]) => {
  const subtotal = lineItems.reduce((total, item) => total + item.totalCost, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;
  
  return { subtotal, gst, total };
};