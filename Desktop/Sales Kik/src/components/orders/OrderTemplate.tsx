// New clean template function
export const generateOrderTemplate = (orderData: any, globalStyling: any, companyProfile: any, pdfSettings: any) => {
  // Generate valid until date (30 days from now)
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 30);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order ${orderData.orderId}</title>
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
            border-bottom: 2px solid ${globalStyling.primaryColor || '#3b82f6'};
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
            background: linear-gradient(135deg, ${globalStyling.primaryColor || '#3b82f6'} 0%, ${globalStyling.secondaryColor || '#1d4ed8'} 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 18px;
            letter-spacing: -0.5px;
            box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
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
            align-items: center;
            text-align: center;
        }
        
        .company-contact p {
            font-size: 12px;
            color: #475569;
            margin-bottom: 2px;
            font-weight: 500;
            line-height: 1.4;
        }
        
        .document-details {
            text-align: right;
            background: white;
            padding: 16px;
            border-radius: 6px;
            border-left: 3px solid ${globalStyling.primaryColor || '#3b82f6'};
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            margin-top: 8px;
        }
        
        .document-type {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }
        
        .document-number {
            font-size: 16px;
            font-weight: 600;
            color: ${globalStyling.primaryColor || '#3b82f6'};
            margin-bottom: 2px;
        }
        
        .document-date {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 2px;
        }
        
        .reference-number {
            font-size: 12px;
            color: #64748b;
        }
        
        .main-content {
            padding: 0;
        }
        
        .section {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .section:last-child {
            border-bottom: none;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 2px solid #e2e8f0;
            position: relative;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 30px;
            height: 2px;
            background: linear-gradient(135deg, ${globalStyling.primaryColor || '#3b82f6'} 0%, ${globalStyling.secondaryColor || '#1d4ed8'} 100%);
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        
        .info-block h3 {
            font-size: 11px;
            font-weight: 600;
            color: ${globalStyling.primaryColor || '#3b82f6'};
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
            background: linear-gradient(135deg, ${globalStyling.primaryColor || '#3b82f6'} 0%, ${globalStyling.secondaryColor || '#1d4ed8'} 100%);
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
            border-bottom: 2px solid ${globalStyling.primaryColor || '#3b82f6'};
            border-top: 2px solid ${globalStyling.primaryColor || '#3b82f6'};
            padding: 10px 12px;
            font-weight: 600;
            font-size: 15px;
            color: #1e293b;
            margin-top: 6px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
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
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 16px;
            border-radius: 4px;
            border-left: 3px solid ${globalStyling.primaryColor || '#3b82f6'};
            box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
        }
        
        .terms-content ul {
            list-style: none;
            padding: 0;
        }
        
        .terms-content li {
            font-size: 12px;
            color: #475569;
            margin-bottom: 6px;
            padding-left: 12px;
            position: relative;
            line-height: 1.4;
        }
        
        .terms-content li::before {
            content: '•';
            color: ${globalStyling.primaryColor || '#3b82f6'};
            font-weight: 600;
            position: absolute;
            left: 0;
        }
        
        .footer {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 8px 16px;
            text-align: center;
            color: white;
        }
        
        .footer p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 12px;
            margin-bottom: 3px;
        }
        
        .footer .highlight {
            color: #60a5fa;
            font-weight: 500;
        }
        
        @media print {
            @page {
                margin: 5mm 10mm 5mm 10mm; /* top right bottom left */
            }
            
            body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                font-size: 11px !important;
            }
            
            .document-container {
                box-shadow: none !important;
                border-radius: 0 !important;
                max-width: 100% !important;
                margin: 0 !important;
            }
            
            .header {
                padding: 12px !important;
            }
            
            .section {
                padding: 8px 12px !important;
            }
            
            .footer {
                padding: 6px 12px !important;
            }
            
            /* Force large logo in print/PDF */
            .logo-image, .company-logo {
                width: 250px !important;
                height: 150px !important;
                max-width: 250px !important;
                max-height: 150px !important;
            }
            
            /* Ensure single page */
            .document-container {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        <!-- Header Section -->
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    ${globalStyling.showLogo !== false ? (
                        companyProfile?.logo ? `
                            <img src="${companyProfile.logo}" alt="Company Logo" class="logo-image" style="width: 300px !important; height: 180px !important; max-width: 300px !important; max-height: 180px !important;" />
                        ` : `
                            <div class="company-logo">${(companyProfile?.name || 'C').charAt(0)}</div>
                        `
                    ) : ''}
                    ${globalStyling.showCompanyName !== false ? `
                    <div class="company-details">
                        <h2>${companyProfile?.name || 'Your Company'}</h2>
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
                    <div class="document-type">Order</div>
                    <div class="document-number">#${orderData.orderId}</div>
                    <div class="document-date">Date: ${new Date().toLocaleDateString()}</div>
                    ${orderData.referenceNumber ? `<div class="reference-number">Ref: ${orderData.referenceNumber}</div>` : ''}
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Document Information -->
            <div class="section">
                <h2 class="section-title">Document Information</h2>
                <div class="two-column">
                    <div class="info-block">
                        <h3>Bill To</h3>
                        <p><strong>${orderData.customer.name}</strong></p>
                        ${orderData.customer.address ? `
                        <p>${orderData.customer.address.streetNumber} ${orderData.customer.address.streetName}</p>
                        <p>${orderData.customer.address.suburb}, ${orderData.customer.address.state} ${orderData.customer.address.postcode}</p>
                        ` : ''}
                        ${orderData.customer.primaryContact?.email ? `<p>${orderData.customer.primaryContact.email}</p>` : ''}
                        ${orderData.customer.primaryContact?.mobile || orderData.customer.phone ? `<p>${orderData.customer.primaryContact.mobile || orderData.customer.phone}</p>` : ''}
                    </div>
                    <div class="info-block">
                        <h3>Project Details</h3>
                        <p><strong>Project:</strong> ${orderData.projectName || 'Order Request'}</p>
                        ${orderData.referenceNumber ? `<p><strong>Reference:</strong> ${orderData.referenceNumber}</p>` : ''}
                        <p><strong>Valid Until:</strong> ${validUntilDate.toLocaleDateString()}</p>
                        <p><strong>Payment Terms:</strong> Net 30</p>
                        <p><strong>Delivery:</strong> ${orderData.delivery?.method ? orderData.delivery.method.charAt(0).toUpperCase() + orderData.delivery.method.slice(1) : 'TBD'}</p>
                        ${orderData.delivery?.contactName ? `<p><strong>Contact:</strong> ${orderData.delivery.contactName}</p>` : ''}
                        ${orderData.delivery?.contactPhone ? `<p><strong>Contact Phone:</strong> ${orderData.delivery.contactPhone}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Items & Services -->
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
                        ${orderData.jobSections.map(section => 
                            section.items.map((item, index) => `
                                <tr>
                                    <td>
                                        <div class="font-medium">${item.customName || item.product.name}</div>
                                        ${!pdfSettings.hideDescription ? `
                                        <div class="item-description">
                                            ${!pdfSettings.hideProductType && !item.isCustom && item.product.code ? `<span style="color: #6b7280; font-weight: 500;">SKU:</span> ${item.product.code}` : ''}
                                            ${!pdfSettings.hideProductType && item.isCustom ? '<span style="color: #7c3aed; font-weight: 600; background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 11px;">CUSTOM ITEM</span>' : ''}
                                            ${section.name !== 'Main Project' ? `<span style="color: #059669; font-weight: 500;"> • Job:</span> ${section.name}` : ''}
                                            ${section.description && !pdfSettings.hideCustomProcess ? `<br><div style="color: #374151; font-style: italic; font-size: 12px; line-height: 1.4; margin-top: 4px;">${section.description}</div>` : ''}
                                            ${pdfSettings.showKitItems && item.kitItems ? `<br><div style="color: #059669; font-size: 11px; margin-top: 4px;"><strong>Kit includes:</strong> ${item.kitItems.join(', ')}</div>` : ''}
                                        </div>
                                        ` : ''}
                                    </td>
                                    <td class="text-right">${item.quantity}</td>
                                    ${!pdfSettings.hideItemPrice ? `<td class="text-right">$${item.unitPrice.toFixed(2)}</td>` : ''}
                                    ${!pdfSettings.hideTotalPrice ? `<td class="text-right font-medium">$${item.totalPrice.toFixed(2)}</td>` : ''}
                                </tr>
                            `).join('')
                        ).join('')}
                    </tbody>
                </table>
                
                <!-- Optional Items Section -->
                ${orderData.optionGroups && Object.keys(orderData.optionGroups).length > 0 ? `
                <div style="margin-top: 20px; padding: 16px; background: #fef9e7; border: 2px solid #f59e0b; border-radius: 8px;">
                    <h3 style="font-size: 16px; font-weight: 600; color: #92400e; margin-bottom: 12px;">
                        Optional:
                    </h3>
                    
                    ${Object.entries(orderData.optionGroups).map(([category, options]) => `
                        <div style="margin-bottom: 16px;">
                            <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: capitalize;">
                                ${category}:
                            </h4>
                            <ul style="margin: 0 0 0 16px; padding-left: 0; list-style: none;">
                                ${options.map(option => `
                                    <li style="margin-bottom: 4px; padding: 6px 12px; background: white; border-left: 3px solid #f59e0b; border-radius: 4px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div style="flex: 1;">
                                                <strong style="color: #374151; font-size: 11px;">• ${option.name}</strong>
                                                ${option.description ? `<div style="color: #6b7280; font-size: 10px; margin-top: 1px;">${option.description}</div>` : ''}
                                            </div>
                                            <div style="text-align: right; color: #059669; font-weight: 600; font-size: 11px;">
                                                ${option.price > 0 ? `+$${option.price.toFixed(2)}` : option.price < 0 ? `-$${Math.abs(option.price).toFixed(2)}` : 'No extra cost'}
                                            </div>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                    
                    <div style="margin-top: 12px; padding: 8px; background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px;">
                        <p style="font-size: 10px; color: #166534; margin: 0;">
                            <strong>💡 Note:</strong> These are available options with their additional costs. Please let us know your preferences.
                        </p>
                    </div>
                </div>
                ` : ''}
                
                <!-- Totals -->
                <div class="totals">
                    <div class="totals-table">
                        <div class="totals-row">
                            <span class="totals-label">Subtotal:</span>
                            <span class="totals-value">$${orderData.totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="totals-row">
                            <span class="totals-label">GST (${((orderData.totals.gst / orderData.totals.subtotal) * 100).toFixed(1)}%):</span>
                            <span class="totals-value">$${orderData.totals.gst.toFixed(2)}</span>
                        </div>
                        <div class="totals-row">
                            <span>Total:</span>
                            <span>$${orderData.totals.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Delivery & Logistics Information -->
            ${orderData.delivery ? `
            <div class="section">
                <h2 class="section-title">Delivery & Logistics</h2>
                <div class="two-column">
                    <div class="info-block">
                        <h3>Fulfillment Method</h3>
                        <p><strong>${(() => {
                            const method = orderData.delivery.method;
                            switch(method) {
                                case 'delivery': return '🚛 Standard Delivery - We deliver to your location';
                                case 'pickup': return '🏢 Customer Pickup - Collect from our location';  
                                case 'courier': return '📦 Express Courier - Fast courier service';
                                default: return '📋 Method To Be Confirmed';
                            }
                        })()}</strong></p>
                        
                        ${orderData.delivery.method === 'pickup' ? `
                        <div style="margin-top: 8px; padding: 8px; background: #e0f2fe; border-radius: 4px;">
                            <p style="font-weight: 600; color: #374151;">Pickup Location:</p>
                            <p>${companyProfile?.name || 'Our Location'}</p>
                            <p>${companyProfile?.address || 'Company Address'}</p>
                            ${companyProfile?.phone ? `<p>Phone: ${companyProfile.phone}</p>` : ''}
                        </div>
                        ` : orderData.delivery.address ? `
                        <div style="margin-top: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px;">
                            <p style="font-weight: 600; color: #374151;">${orderData.delivery.method === 'courier' ? 'Courier Delivery Address:' : 'Delivery Address:'}</p>
                            <p>${orderData.delivery.address.streetNumber} ${orderData.delivery.address.streetName}</p>
                            <p>${orderData.delivery.address.suburb}, ${orderData.delivery.address.state} ${orderData.delivery.address.postcode}</p>
                        </div>
                        ` : ''}
                        
                        ${orderData.delivery.isAddressConfirmed ? 
                            '<div style="color: #059669; font-weight: 600; margin-top: 8px; padding: 6px; background: #d1fae5; border-radius: 4px;">✓ Address confirmed</div>' : 
                            '<div style="color: #d97706; font-weight: 600; margin-top: 8px; padding: 6px; background: #fef3c7; border-radius: 4px;">⚠️ Address requires confirmation</div>'
                        }
                    </div>
                    <div class="info-block">
                        <h3>${orderData.delivery.method === 'pickup' ? 'Pickup Coordinator' : 'Delivery Coordinator'}</h3>
                        ${orderData.delivery.contactName ? `<p><strong>Primary Contact:</strong> ${orderData.delivery.contactName}</p>` : ''}
                        ${orderData.delivery.contactPhone ? `<p><strong>Contact Number:</strong> ${orderData.delivery.contactPhone}</p>` : ''}
                        <p style="font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">
                            ${orderData.delivery.method === 'pickup' ? 
                                'Please call ahead to arrange pickup time (8AM - 5PM weekdays)' :
                                'Please ensure contact person is available during delivery hours (8AM - 5PM weekdays)'
                            }
                        </p>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Accounting Information -->
            ${orderData.accounting && !pdfSettings.hidePaymentDetails ? `
            <div class="section">
                <h2 class="section-title">Accounting & Payment Details</h2>
                <div class="two-column">
                    <div class="info-block">
                        <h3>Chart of Accounts</h3>
                        <p><strong>Revenue Account:</strong> ${orderData.accounting.accountNumber}</p>
                        <p><strong>Tax Classification:</strong> ${orderData.accounting.gstRate.replace(/^(\d+)-(.+)/, (match, rate, description) => {
                            const rateText = rate + '% GST';
                            const descText = description.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            return `${rateText} - ${descText}`;
                        })}</p>
                        ${orderData.totals.weight > 0 ? `<p><strong>Total Weight:</strong> ${orderData.totals.weight.toFixed(1)} kg</p>` : ''}
                    </div>
                    <div class="info-block">
                        <h3>Financial Summary</h3>
                        <p><strong>Payment Terms:</strong> Net 30 days from invoice date</p>
                        <p><strong>GST Collected:</strong> $${orderData.accounting.gstAmount.toFixed(2)}</p>
                        <p style="color: #059669; font-weight: 600;"><strong>Total Due:</strong> $${orderData.totals.total.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Comments & Special Instructions -->
            ${orderData.comments && !pdfSettings.hideCustomText ? `
            <div class="section">
                <h2 class="section-title">Special Instructions & Notes</h2>
                <div class="terms-content" style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px;">
                    <div style="white-space: pre-wrap; color: #92400e; font-size: 13px; line-height: 1.6; font-weight: 500;">${orderData.comments}</div>
                    <div style="margin-top: 8px; font-size: 11px; color: #a16207; font-style: italic;">
                        ℹ️ These are special requirements or notes for this project
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Terms & Conditions -->
            ${orderData.standardText && !pdfSettings.hideCustomText ? `
            <div class="section">
                <h2 class="section-title">Terms & Conditions</h2>
                <div class="terms-content">
                    <div style="white-space: pre-wrap; color: #475569; font-size: 12px; line-height: 1.4;">${orderData.standardText}</div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <!-- Order Acceptance Signature Section -->
        ${pdfSettings.insertAcceptanceSignature ? `
        <div class="section" style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <h2 class="section-title">Order Confirmation</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                <div>
                    <p style="font-weight: 600; margin-bottom: 10px; color: #374151;">Customer Signature</p>
                    <div style="border-bottom: 2px solid #d1d5db; height: 50px; margin-bottom: 10px;"></div>
                    <p style="font-size: 11px; color: #6b7280;">Print Name: _________________________</p>
                    <p style="font-size: 11px; color: #6b7280; margin-top: 5px;">Date: _________________________</p>
                </div>
                <div>
                    <p style="font-weight: 600; margin-bottom: 10px; color: #374151;">Order Processed By</p>
                    <div style="border-bottom: 2px solid #d1d5db; height: 50px; margin-bottom: 10px;"></div>
                    <p style="font-size: 11px; color: #6b7280;">Print Name: _________________________</p>
                    <p style="font-size: 11px; color: #6b7280; margin-top: 5px;">Date: _________________________</p>
                </div>
            </div>
            <div style="margin-top: 15px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid ${globalStyling.primaryColor || '#3b82f6'};">
                <p style="font-size: 11px; color: #374151; line-height: 1.4;">
                    <strong>By signing above, you confirm this order and authorize processing. 
                    Please review all details carefully before signing.</strong>
                </p>
            </div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing ${companyProfile?.name || 'our services'}</p>
            <p>Questions? Contact us at <span class="highlight">${companyProfile?.email || 'hello@company.com'}</span> or <span class="highlight">${companyProfile?.phone || '(555) 123-4567'}</span></p>
        </div>
    </div>
</body>
</html>`;
};