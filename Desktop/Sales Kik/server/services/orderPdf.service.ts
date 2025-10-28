const htmlPdf = require('html-pdf-node');
import path from 'path';
import fs from 'fs/promises';

export interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  project_name?: string;
  job_name?: string;
  reference_number?: string;
  order_date: Date;
  due_date?: Date;
  delivery_method?: string;
  delivery_address?: string;
  delivery_contact?: string;
  delivery_phone?: string;
  delivery_instructions?: string;
  line_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  options?: {
    category_name: string;
    option_name: string;
    option_price: number;
    description?: string;
    is_selected?: boolean;
  }[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  special_instructions?: string;
  priority?: string;
  status?: string;
}

export interface OrderTemplate {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo?: string;
  header_color: string;
  font_family: string;
  show_tax: boolean;
  tax_rate: number;
}

class OrderPDFService {
  private isAvailable: boolean = true;

  async generateOrderPDF(htmlContent: string, filename: string = 'order.pdf'): Promise<Buffer>;
  async generateOrderPDF(orderData: OrderData, template: OrderTemplate, filename?: string): Promise<Buffer>;
  async generateOrderPDF(
    htmlContentOrOrderData: string | OrderData, 
    filenameOrTemplate?: string | OrderTemplate, 
    filename?: string
  ): Promise<Buffer> {
    // Handle both overloads
    let htmlContent: string;
    let finalFilename: string;

    if (typeof htmlContentOrOrderData === 'string') {
      // Legacy usage: generateOrderPDF(htmlContent, filename)
      htmlContent = htmlContentOrOrderData;
      finalFilename = (filenameOrTemplate as string) || 'order.pdf';
    } else {
      // New usage: generateOrderPDF(orderData, template, filename?)
      const orderData = htmlContentOrOrderData;
      const template = filenameOrTemplate as OrderTemplate;
      htmlContent = this.generateOrderHTML(orderData, template);
      finalFilename = filename || `order-${orderData.order_number}.pdf`;
    }

    try {
      console.log(`🔄 Starting PDF generation for: ${finalFilename}`);
      
      // Check if PDF service is available
      if (!this.isAvailable) {
        throw new Error('PDF service temporarily unavailable');
      }

      // Configure PDF options with shorter timeout
      const options = {
        format: 'A4',
        border: {
          top: '10px',
          bottom: '10px', 
          left: '10px',
          right: '10px'
        },
        printBackground: true,
        timeout: 10000, // Reduced timeout
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      };

      const file = {
        content: htmlContent
      };

      // Generate PDF buffer with timeout handling
      const pdfBuffer = await Promise.race([
        htmlPdf.generatePdf(file, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF generation timeout')), 15000)
        )
      ]) as Buffer;
      
      console.log(`✅ PDF generated successfully: ${finalFilename} (${pdfBuffer.length} bytes)`);
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ Failed to generate PDF:', error);
      // Mark service as temporarily unavailable after failure
      this.isAvailable = false;
      
      // Reset availability after 5 minutes
      setTimeout(() => {
        this.isAvailable = true;
        console.log('🔄 PDF service re-enabled');
      }, 5 * 60 * 1000);
      
      throw error;
    }
  }

  private generateOrderHTML(orderData: OrderData, template: OrderTemplate): string {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatDate = (date: Date) => date.toLocaleDateString('en-AU');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order ${orderData.order_number}</title>
    <style>
        body {
            font-family: '${template.font_family}', Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
        }
        
        .header {
            background-color: ${template.header_color};
            color: white;
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .company-info h1 {
            margin: 0 0 5px 0;
            font-size: 28px;
            font-weight: bold;
        }
        
        .company-info p {
            margin: 2px 0;
            font-size: 14px;
        }
        
        .order-title {
            text-align: right;
        }
        
        .order-title h2 {
            margin: 0;
            font-size: 24px;
            font-weight: normal;
        }
        
        .order-number {
            font-size: 18px;
            margin-top: 5px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 5px;
            background: #10B981;
            color: white;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .order-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        
        .customer-details h3,
        .order-info h3,
        .delivery-info h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: ${template.header_color};
            border-bottom: 2px solid ${template.header_color};
            padding-bottom: 5px;
        }
        
        .customer-details p,
        .order-info p,
        .delivery-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        
        .items-table th {
            background-color: ${template.header_color};
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .text-right {
            text-align: right;
        }
        
        .totals {
            margin-top: 30px;
            text-align: right;
        }
        
        .totals table {
            margin-left: auto;
            border-collapse: collapse;
        }
        
        .totals td {
            padding: 8px 15px;
            border-bottom: 1px solid #ddd;
        }
        
        .totals .total-row {
            font-weight: bold;
            font-size: 18px;
            background-color: ${template.header_color};
            color: white;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid ${template.header_color};
        }
        
        .notes {
            margin-bottom: 20px;
        }
        
        .instructions {
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h1>${template.company_name}</h1>
            <p>${template.company_address}</p>
            <p>Phone: ${template.company_phone}</p>
            <p>Email: ${template.company_email}</p>
        </div>
        <div class="order-title">
            <h2>PURCHASE ORDER</h2>
            <div class="order-number">${orderData.order_number}</div>
            <div class="status-badge">${(orderData.status || 'PENDING').toUpperCase()}</div>
        </div>
    </div>
    
    <div class="content">
        <div class="order-details">
            <div class="customer-details">
                <h3>Order To:</h3>
                <p><strong>${orderData.customer_name}</strong></p>
                ${orderData.customer_email ? `<p>${orderData.customer_email}</p>` : ''}
                ${orderData.customer_address ? `<p>${orderData.customer_address}</p>` : ''}
            </div>
            
            <div class="order-info">
                <h3>Order Details:</h3>
                ${orderData.reference_number ? `<p><strong>Reference:</strong> ${orderData.reference_number}</p>` : ''}
                ${orderData.project_name ? `<p><strong>Project:</strong> ${orderData.project_name}</p>` : ''}
                ${orderData.job_name ? `<p><strong>Job:</strong> ${orderData.job_name}</p>` : ''}
                <p><strong>Order Date:</strong> ${formatDate(orderData.order_date)}</p>
                ${orderData.due_date ? `<p><strong>Due Date:</strong> ${formatDate(orderData.due_date)}</p>` : ''}
                ${orderData.priority ? `<p><strong>Priority:</strong> ${orderData.priority}</p>` : ''}
            </div>
            
            ${orderData.delivery_method ? `
            <div class="delivery-info">
                <h3>Delivery Information:</h3>
                <p><strong>Method:</strong> ${orderData.delivery_method.toUpperCase()}</p>
                ${orderData.delivery_address ? `<p><strong>Address:</strong> ${orderData.delivery_address}</p>` : ''}
                ${orderData.delivery_contact ? `<p><strong>Contact:</strong> ${orderData.delivery_contact}</p>` : ''}
                ${orderData.delivery_phone ? `<p><strong>Phone:</strong> ${orderData.delivery_phone}</p>` : ''}
                ${orderData.delivery_instructions ? `<p><strong>Instructions:</strong> ${orderData.delivery_instructions}</p>` : ''}
            </div>
            ` : ''}
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${orderData.line_items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.unit_price)}</td>
                        <td class="text-right">${formatCurrency(item.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <table>
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">${formatCurrency(orderData.subtotal)}</td>
                </tr>
                ${template.show_tax ? `
                <tr>
                    <td>Tax (${template.tax_rate}%):</td>
                    <td class="text-right">${formatCurrency(orderData.tax_amount)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td>Total:</td>
                    <td class="text-right">${formatCurrency(orderData.total_amount)}</td>
                </tr>
            </table>
        </div>
        
        <div class="footer">
            ${orderData.special_instructions ? `
            <div class="notes">
                <h3>Special Instructions:</h3>
                <p>${orderData.special_instructions}</p>
            </div>
            ` : ''}
            
            ${orderData.notes ? `
            <div class="instructions">
                <h4>Additional Notes:</h4>
                <p>${orderData.notes}</p>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
    `;
  }

  async saveOrderPDF(orderId: string, pdfBuffer: Buffer): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'orders');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const filename = `order-${orderId}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    
    await fs.writeFile(filepath, pdfBuffer);
    
    return filepath;
  }
}

export default new OrderPDFService();