const htmlPdf = require('html-pdf-node');

class PDFService {
  private isAvailable: boolean = true;

  async generateQuotePDF(htmlContent: string, filename: string = 'quote.pdf'): Promise<Buffer> {
    try {
      console.log(`🔄 Starting PDF generation for: ${filename}`);
      
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
      
      console.log(`✅ PDF generated successfully: ${filename} (${pdfBuffer.length} bytes)`);
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
  
  async isHealthy(): Promise<boolean> {
    try {
      // Test with simple HTML
      const testHtml = '<html><body><h1>Test</h1></body></html>';
      const testPdf = await this.generateQuotePDF(testHtml, 'test.pdf');
      return testPdf.length > 0;
    } catch (error) {
      console.error('PDF service health check failed:', error);
      return false;
    }
  }
}

export default new PDFService();