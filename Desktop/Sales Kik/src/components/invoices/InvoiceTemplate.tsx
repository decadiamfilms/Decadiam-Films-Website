// Invoice template function - re-skinned order template
export const generateInvoiceTemplate = (invoiceData: any, globalStyling: any, companyProfile: any, pdfSettings: any) => {
  // Use lime/green theme for invoices
  const invoiceStyling = {
    ...globalStyling,
    primaryColor: '#84cc16',
    secondaryColor: '#65a30d'
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceData.invoiceId}</title>
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
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 16px;
            border-bottom: 2px solid ${globalStyling.primaryColor || '#84cc16'};
        }
        
        .header-content {
            display: grid;
            grid-template-columns: 320px 1fr 200px;
            gap: 20px;
            align-items: start;
        }
        
        .company-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .company-logo {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: contain;
            background: white;
            padding: 4px;
        }
        
        .company-details h1 {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 2px;
        }
        
        .company-details p {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 1px;
        }
        
        .document-title {
            text-align: center;
            padding: 8px 0;
        }
        
        .document-title h2 {
            font-size: 28px;
            font-weight: 700;
            color: #16a34a;
            margin-bottom: 4px;
            letter-spacing: 2px;
        }
        
        .document-title p {
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .invoice-meta {
            text-align: right;
        }
        
        .invoice-meta h3 {
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }
        
        .meta-item {
            margin-bottom: 8px;
        }
        
        .meta-label {
            font-size: 9px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 2px;
        }
        
        .meta-value {
            font-size: 11px;
            color: #1f2937;
            font-weight: 600;
        }
        
        .content {
            padding: 20px;
        }
        
        .billing-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .billing-info h3 {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px;
        }
        
        .billing-info p {
            font-size: 11px;
            color: #4b5563;
            margin-bottom: 3px;
        }
        
        .billing-info .company-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 12px;
        }
        
        .items-section {
            margin-bottom: 20px;
        }
        
        .items-header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 12px 16px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            letter-spacing: 1px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        
        .items-table th {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 8px;
            font-size: 10px;
            font-weight: 600;
            color: #374151;
            text-align: left;
        }
        
        .items-table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            font-size: 10px;
            color: #4b5563;
            vertical-align: top;
        }
        
        .items-table .item-description {
            max-width: 250px;
        }
        
        .items-table .price-cell {
            text-align: right;
            font-weight: 600;
            color: #059669;
        }
        
        .totals-section {
            margin-top: 16px;
            padding: 16px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 6px;
            border: 1px solid #16a34a;
        }
        
        .totals-table {
            width: 100%;
            max-width: 300px;
            margin-left: auto;
        }
        
        .totals-table td {
            padding: 4px 8px;
            font-size: 11px;
            border: none;
        }
        
        .totals-table .label {
            color: #374151;
            font-weight: 500;
        }
        
        .totals-table .value {
            text-align: right;
            color: #1f2937;
            font-weight: 600;
        }
        
        .totals-table .total-row {
            border-top: 2px solid #16a34a;
            padding-top: 8px;
        }
        
        .totals-table .total-row .label {
            font-size: 13px;
            font-weight: 700;
            color: #16a34a;
        }
        
        .totals-table .total-row .value {
            font-size: 16px;
            font-weight: 700;
            color: #16a34a;
        }
        
        .payment-section {
            margin-top: 20px;
            padding: 16px;
            background: #fffbeb;
            border-radius: 6px;
            border: 1px solid #f59e0b;
        }
        
        .payment-section h3 {
            font-size: 12px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .payment-section p {
            font-size: 10px;
            color: #78350f;
            margin-bottom: 4px;
        }
        
        .status-section {
            margin-top: 20px;
            padding: 12px;
            background: #fef3c7;
            border-radius: 6px;
            border: 1px solid #f59e0b;
            text-align: center;
        }
        
        .status-section .status-badge {
            display: inline-block;
            padding: 6px 12px;
            background: #16a34a;
            color: white;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .footer {
            margin-top: 24px;
            padding: 16px;
            background: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            text-align: center;
        }
        
        .footer p {
            font-size: 9px;
            color: #64748b;
            margin-bottom: 2px;
        }
        
        @media print {
            body { 
                background: white; 
                padding: 0; 
            }
            .document-container { 
                box-shadow: none; 
                border-radius: 0; 
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    ${companyProfile?.logoUrl ? `<img src="${companyProfile.logoUrl}" alt="${companyProfile.name}" class="company-logo">` : ''}
                    <div class="company-details">
                        <h1>${companyProfile?.name || 'Your Company'}</h1>
                        <p>${companyProfile?.email || ''}</p>
                        <p>${companyProfile?.phone || ''}</p>
                        <p>${companyProfile?.address || ''}</p>
                    </div>
                </div>
                
                <div class="document-title">
                    <h2>INVOICE</h2>
                    <p>Professional Invoice Document</p>
                </div>
                
                <div class="invoice-meta">
                    <h3>Invoice Details</h3>
                    <div class="meta-item">
                        <div class="meta-label">Invoice ID</div>
                        <div class="meta-value">${invoiceData.invoiceId}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Invoice Date</div>
                        <div class="meta-value">${invoiceData.invoiceDate.toLocaleDateString()}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Due Date</div>
                        <div class="meta-value">${invoiceData.dueDate.toLocaleDateString()}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Sales Rep</div>
                        <div class="meta-value">${invoiceData.salesRep}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="billing-section">
                <div class="billing-info">
                    <h3>Bill To</h3>
                    <p class="company-name">${invoiceData.customerName}</p>
                    ${invoiceData.customerEmail ? `<p>${invoiceData.customerEmail}</p>` : ''}
                    ${invoiceData.customerPhone ? `<p>${invoiceData.customerPhone}</p>` : ''}
                </div>
                
                <div class="billing-info">
                    <h3>Invoice Information</h3>
                    <p><strong>Reference:</strong> ${invoiceData.reference}</p>
                    <p><strong>Status:</strong> ${invoiceData.status.replace('invoice-', '').replace('-', ' ').toUpperCase()}</p>
                    ${invoiceData.notes ? `<p><strong>Notes:</strong> ${invoiceData.notes}</p>` : ''}
                </div>
            </div>
            
            <div class="items-section">
                <div class="items-header">
                    INVOICE ITEMS
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 60%;">Description</th>
                            <th style="width: 20%; text-align: right;">Quantity</th>
                            <th style="width: 20%; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="item-description">
                                <strong>${invoiceData.reference}</strong><br>
                                ${invoiceData.notes ? `<small style="color: #6b7280;">${invoiceData.notes}</small>` : ''}
                            </td>
                            <td class="price-cell">1</td>
                            <td class="price-cell">$${invoiceData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal:</td>
                        <td class="value">$${(invoiceData.amount / 1.1).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td class="label">GST (10%):</td>
                        <td class="value">$${(invoiceData.amount - (invoiceData.amount / 1.1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="total-row">
                        <td class="label">Total Amount:</td>
                        <td class="value">$${invoiceData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </table>
            </div>
            
            <div class="payment-section">
                <h3>Payment Information</h3>
                <p><strong>Payment Terms:</strong> Net 30 days</p>
                <p><strong>Due Date:</strong> ${invoiceData.dueDate.toLocaleDateString()}</p>
                ${companyProfile?.bankDetails ? `<p><strong>Bank Details:</strong> ${companyProfile.bankDetails}</p>` : ''}
                ${companyProfile?.paymentInstructions ? `<p>${companyProfile.paymentInstructions}</p>` : ''}
            </div>
            
            <div class="status-section">
                <div class="status-badge">
                    ${invoiceData.status.replace('invoice-', '').replace('-', ' ').toUpperCase()}
                </div>
                ${invoiceData.originalOrderId ? `<p style="margin-top: 8px; font-size: 9px; color: #6b7280;">Converted from Order ${invoiceData.originalOrderId}</p>` : ''}
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>This invoice was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            ${companyProfile?.website ? `<p>Visit us at ${companyProfile.website}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
};