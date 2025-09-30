// Company Branding Service for Email Templates
// Manages dynamic logos, brand colors, signatures, and professional email formatting

export interface CompanyBranding {
  id: string;
  companyName: string;
  tradingName?: string;
  logo: {
    primary: string; // URL or base64
    secondary?: string;
    favicon?: string;
    width?: number;
    height?: number;
  };
  colors: {
    primary: string; // Hex color
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    neutral: string;
    background: string;
    text: string;
  };
  typography: {
    primaryFont: string;
    secondaryFont: string;
    headingWeight: string;
    bodyWeight: string;
  };
  emailSignature: {
    enabled: boolean;
    template: string;
    variables: { [key: string]: any };
  };
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    website: string;
    abn?: string;
    registrationNumber?: string;
  };
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  customCSS?: string;
  emailFooter?: string;
  disclaimers?: string[];
}

export interface EmailBrandingOptions {
  useCompanyLogo: boolean;
  useCompanyColors: boolean;
  includeSignature: boolean;
  includeFooter: boolean;
  includeDisclaimers: boolean;
  customHeaderText?: string;
  customFooterText?: string;
  templateVariant: 'PROFESSIONAL' | 'MINIMAL' | 'BRANDED' | 'CORPORATE';
}

class CompanyBrandingService {
  private static instance: CompanyBrandingService;
  private companyBranding: CompanyBranding | null = null;

  private constructor() {
    this.loadCompanyBranding();
  }

  public static getInstance(): CompanyBrandingService {
    if (!CompanyBrandingService.instance) {
      CompanyBrandingService.instance = new CompanyBrandingService();
    }
    return CompanyBrandingService.instance;
  }

  private loadCompanyBranding(): void {
    const savedBranding = localStorage.getItem('saleskik-company-branding');
    if (savedBranding) {
      try {
        this.companyBranding = JSON.parse(savedBranding);
      } catch (error) {
        console.error('Error loading company branding:', error);
      }
    }

    // Create default branding if none exists
    if (!this.companyBranding) {
      this.createDefaultBranding();
    }
  }

  private createDefaultBranding(): void {
    this.companyBranding = {
      id: 'default-branding',
      companyName: 'Ecco Hardware',
      tradingName: 'Ecco Hardware Pty Ltd',
      logo: {
        primary: '/saleskik-logo.png',
        width: 180,
        height: 60
      },
      colors: {
        primary: '#3B82F6',    // Blue
        secondary: '#6366F1',  // Indigo
        accent: '#10B981',     // Green
        success: '#059669',    // Dark green
        warning: '#F59E0B',    // Amber
        error: '#EF4444',      // Red
        neutral: '#6B7280',    // Gray
        background: '#F9FAFB', // Light gray
        text: '#1F2937'        // Dark gray
      },
      typography: {
        primaryFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        secondaryFont: 'Georgia, "Times New Roman", serif',
        headingWeight: '700',
        bodyWeight: '400'
      },
      emailSignature: {
        enabled: true,
        template: `
          <div style="border-top: 2px solid {{primaryColor}}; padding-top: 20px; margin-top: 30px;">
            <table cellpadding="0" cellspacing="0" style="font-family: {{primaryFont}};">
              <tr>
                <td style="padding-right: 20px; vertical-align: top;">
                  {{#if companyLogo}}
                  <img src="{{companyLogo}}" alt="{{companyName}}" style="height: 50px; width: auto;">
                  {{/if}}
                </td>
                <td style="vertical-align: top;">
                  <div style="font-weight: 600; color: {{textColor}}; font-size: 16px; margin-bottom: 5px;">
                    {{senderName}}
                  </div>
                  <div style="color: {{primaryColor}}; font-weight: 500; margin-bottom: 8px;">
                    {{senderTitle}}
                  </div>
                  <div style="color: {{textColor}}; font-weight: 600; margin-bottom: 8px;">
                    {{companyName}}
                  </div>
                  <div style="font-size: 14px; color: {{neutralColor}}; line-height: 1.4;">
                    {{#if phone}}<div>📞 {{phone}}</div>{{/if}}
                    {{#if email}}<div>📧 <a href="mailto:{{email}}" style="color: {{primaryColor}}; text-decoration: none;">{{email}}</a></div>{{/if}}
                    {{#if website}}<div>🌐 <a href="{{website}}" style="color: {{primaryColor}}; text-decoration: none;">{{website}}</a></div>{{/if}}
                    {{#if address}}<div>📍 {{address}}</div>{{/if}}
                  </div>
                </td>
              </tr>
            </table>
          </div>
        `,
        variables: {
          senderName: 'Adam Smith',
          senderTitle: 'Procurement Manager',
          phone: '+61 2 9876 5432',
          email: 'adam@eccohardware.com.au',
          website: 'www.eccohardware.com.au',
          address: '123 Business Street, Sydney NSW 2000'
        }
      },
      contactInfo: {
        address: '123 Business Street, Sydney NSW 2000, Australia',
        phone: '+61 2 9876 5432',
        email: 'info@eccohardware.com.au',
        website: 'www.eccohardware.com.au',
        abn: '12 345 678 901'
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/company/eccohardware',
        facebook: 'https://facebook.com/eccohardware'
      },
      emailFooter: `
        <div style="text-align: center; padding: 20px; background-color: {{backgroundColor}}; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0 0 10px 0; color: {{neutralColor}}; font-size: 14px;">
            This email was sent by {{companyName}} Purchase Order System
          </p>
          <p style="margin: 0 0 15px 0; color: {{neutralColor}}; font-size: 12px;">
            {{address}} | ABN: {{abn}}
          </p>
          {{#if socialMedia}}
          <div style="margin: 15px 0;">
            {{#if linkedin}}
            <a href="{{linkedin}}" style="margin: 0 10px; color: {{primaryColor}}; text-decoration: none;">LinkedIn</a>
            {{/if}}
            {{#if website}}
            <a href="{{website}}" style="margin: 0 10px; color: {{primaryColor}}; text-decoration: none;">Website</a>
            {{/if}}
          </div>
          {{/if}}
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; color: {{neutralColor}}; font-size: 11px;">
              Powered by SalesKik Professional Procurement Platform
            </p>
          </div>
        </div>
      `,
      disclaimers: [
        'This email and any attachments are confidential and may be privileged.',
        'Please do not reply to this automated email.',
        'For support, contact your procurement team directly.'
      ]
    };

    this.saveCompanyBranding();
  }

  private saveCompanyBranding(): void {
    if (this.companyBranding) {
      localStorage.setItem('saleskik-company-branding', JSON.stringify(this.companyBranding));
    }
  }

  // Apply branding to email template
  public applyBrandingToTemplate(
    htmlTemplate: string,
    textTemplate: string,
    variables: { [key: string]: any },
    options: EmailBrandingOptions = {
      useCompanyLogo: true,
      useCompanyColors: true,
      includeSignature: true,
      includeFooter: true,
      includeDisclaimers: true,
      templateVariant: 'PROFESSIONAL'
    }
  ): { html: string; text: string } {
    if (!this.companyBranding) {
      return { html: htmlTemplate, text: textTemplate };
    }

    // Prepare branding variables
    const brandingVariables = {
      ...variables,
      ...this.getBrandingVariables(options)
    };

    // Apply branding to HTML template
    let brandedHTML = this.applyBrandingToHTML(htmlTemplate, brandingVariables, options);
    
    // Apply branding to text template
    let brandedText = this.applyBrandingToText(textTemplate, brandingVariables, options);

    return { html: brandedHTML, text: brandedText };
  }

  private getBrandingVariables(options: EmailBrandingOptions): { [key: string]: any } {
    if (!this.companyBranding) return {};

    return {
      companyName: this.companyBranding.companyName,
      tradingName: this.companyBranding.tradingName,
      companyLogo: options.useCompanyLogo ? this.companyBranding.logo.primary : '',
      logoWidth: this.companyBranding.logo.width || 180,
      logoHeight: this.companyBranding.logo.height || 60,
      primaryColor: this.companyBranding.colors.primary,
      secondaryColor: this.companyBranding.colors.secondary,
      accentColor: this.companyBranding.colors.accent,
      successColor: this.companyBranding.colors.success,
      warningColor: this.companyBranding.colors.warning,
      errorColor: this.companyBranding.colors.error,
      neutralColor: this.companyBranding.colors.neutral,
      backgroundColor: this.companyBranding.colors.background,
      textColor: this.companyBranding.colors.text,
      primaryFont: this.companyBranding.typography.primaryFont,
      secondaryFont: this.companyBranding.typography.secondaryFont,
      headingWeight: this.companyBranding.typography.headingWeight,
      bodyWeight: this.companyBranding.typography.bodyWeight,
      phone: this.companyBranding.contactInfo.phone,
      email: this.companyBranding.contactInfo.email,
      website: this.companyBranding.contactInfo.website,
      address: this.companyBranding.contactInfo.address,
      abn: this.companyBranding.contactInfo.abn,
      linkedin: this.companyBranding.socialMedia?.linkedin,
      facebook: this.companyBranding.socialMedia?.facebook,
      ...this.companyBranding.emailSignature.variables
    };
  }

  private applyBrandingToHTML(template: string, variables: any, options: EmailBrandingOptions): string {
    let brandedTemplate = template;

    // Apply company colors to CSS variables
    if (options.useCompanyColors) {
      brandedTemplate = this.injectBrandColors(brandedTemplate, variables);
    }

    // Add signature if enabled
    if (options.includeSignature && this.companyBranding?.emailSignature.enabled) {
      brandedTemplate = this.addEmailSignature(brandedTemplate, variables);
    }

    // Add footer if enabled
    if (options.includeFooter && this.companyBranding?.emailFooter) {
      brandedTemplate = this.addEmailFooter(brandedTemplate, variables);
    }

    // Add disclaimers if enabled
    if (options.includeDisclaimers && this.companyBranding?.disclaimers) {
      brandedTemplate = this.addDisclaimers(brandedTemplate, variables);
    }

    // Apply template variant styling
    brandedTemplate = this.applyTemplateVariant(brandedTemplate, options.templateVariant, variables);

    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      brandedTemplate = brandedTemplate.replace(regex, String(value || ''));
    });

    // Process conditional blocks
    brandedTemplate = this.processConditionals(brandedTemplate, variables);

    return brandedTemplate;
  }

  private injectBrandColors(template: string, variables: any): string {
    // Inject CSS custom properties for dynamic color usage
    const colorCSS = `
      <style>
        :root {
          --brand-primary: ${variables.primaryColor};
          --brand-secondary: ${variables.secondaryColor};
          --brand-accent: ${variables.accentColor};
          --brand-success: ${variables.successColor};
          --brand-warning: ${variables.warningColor};
          --brand-error: ${variables.errorColor};
          --brand-neutral: ${variables.neutralColor};
          --brand-background: ${variables.backgroundColor};
          --brand-text: ${variables.textColor};
        }
        
        .brand-header {
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)) !important;
        }
        
        .brand-button {
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)) !important;
          border: none !important;
          color: white !important;
        }
        
        .brand-button:hover {
          background: linear-gradient(135deg, var(--brand-secondary), var(--brand-primary)) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        .brand-accent {
          color: var(--brand-accent) !important;
        }
        
        .brand-text {
          color: var(--brand-text) !important;
        }
        
        .brand-border {
          border-color: var(--brand-primary) !important;
        }
        
        .alert-success {
          background-color: color-mix(in srgb, var(--brand-success) 10%, white) !important;
          border-color: var(--brand-success) !important;
          color: color-mix(in srgb, var(--brand-success) 80%, black) !important;
        }
        
        .alert-warning {
          background-color: color-mix(in srgb, var(--brand-warning) 10%, white) !important;
          border-color: var(--brand-warning) !important;
          color: color-mix(in srgb, var(--brand-warning) 80%, black) !important;
        }
        
        .alert-error {
          background-color: color-mix(in srgb, var(--brand-error) 10%, white) !important;
          border-color: var(--brand-error) !important;
          color: color-mix(in srgb, var(--brand-error) 80%, black) !important;
        }
      </style>
    `;

    // Inject into head section
    return template.replace('</head>', `${colorCSS}</head>`);
  }

  private addEmailSignature(template: string, variables: any): string {
    if (!this.companyBranding?.emailSignature.template) return template;

    let signature = this.companyBranding.emailSignature.template;

    // Replace signature variables
    Object.entries({ ...variables, ...this.companyBranding.emailSignature.variables }).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      signature = signature.replace(regex, String(value || ''));
    });

    // Process conditionals in signature
    signature = this.processConditionals(signature, variables);

    // Insert signature before closing content div
    return template.replace('</div>\s*</div>\s*</body>', `${signature}</div></div></body>`);
  }

  private addEmailFooter(template: string, variables: any): string {
    if (!this.companyBranding?.emailFooter) return template;

    let footer = this.companyBranding.emailFooter;

    // Replace footer variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      footer = footer.replace(regex, String(value || ''));
    });

    // Process conditionals in footer
    footer = this.processConditionals(footer, variables);

    // Insert footer before closing body
    return template.replace('</body>', `${footer}</body>`);
  }

  private addDisclaimers(template: string, variables: any): string {
    if (!this.companyBranding?.disclaimers || this.companyBranding.disclaimers.length === 0) {
      return template;
    }

    const disclaimerHTML = `
      <div style="background-color: ${variables.backgroundColor}; padding: 20px; margin-top: 30px; border-top: 1px solid #E5E7EB;">
        <div style="font-size: 11px; color: ${variables.neutralColor}; line-height: 1.4; text-align: center;">
          ${this.companyBranding.disclaimers.map(disclaimer => 
            `<p style="margin: 5px 0;">${disclaimer}</p>`
          ).join('')}
        </div>
      </div>
    `;

    return template.replace('</body>', `${disclaimerHTML}</body>`);
  }

  private applyTemplateVariant(template: string, variant: string, variables: any): string {
    const variantStyles = this.getVariantStyles(variant, variables);
    
    // Inject variant-specific styles
    return template.replace('</head>', `<style>${variantStyles}</style></head>`);
  }

  private getVariantStyles(variant: string, variables: any): string {
    switch (variant) {
      case 'MINIMAL':
        return `
          .header { background: ${variables.backgroundColor} !important; color: ${variables.textColor} !important; }
          .cta-button { background: ${variables.primaryColor} !important; }
          .email-container { box-shadow: none !important; border: 1px solid #E5E7EB; }
        `;
      
      case 'CORPORATE':
        return `
          .header { 
            background: linear-gradient(45deg, ${variables.primaryColor}, ${variables.secondaryColor}, ${variables.accentColor}) !important;
            padding: 40px 20px !important;
          }
          .content { padding: 50px 40px !important; }
          .cta-button { 
            background: ${variables.primaryColor} !important;
            padding: 18px 36px !important;
            font-size: 16px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
        `;
      
      case 'BRANDED':
        return `
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, ${variables.primaryColor}, ${variables.accentColor});
          }
          .email-container {
            border: 2px solid ${variables.primaryColor};
            border-radius: 16px !important;
          }
        `;
      
      default: // PROFESSIONAL
        return `
          .header { 
            background: linear-gradient(135deg, ${variables.primaryColor}, ${variables.secondaryColor}) !important;
          }
          .cta-button { 
            background: linear-gradient(135deg, ${variables.primaryColor}, ${variables.secondaryColor}) !important;
          }
        `;
    }
  }

  private applyBrandingToText(template: string, variables: any, options: EmailBrandingOptions): string {
    let brandedText = template;

    // Replace all variables in text template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      brandedText = brandedText.replace(regex, String(value || ''));
    });

    // Add text signature if enabled
    if (options.includeSignature && this.companyBranding?.emailSignature.enabled) {
      const textSignature = `

---
${variables.senderName || 'Purchase Order Team'}
${variables.senderTitle || 'Procurement'}
${this.companyBranding.companyName}

${this.companyBranding.contactInfo.phone}
${this.companyBranding.contactInfo.email}
${this.companyBranding.contactInfo.website}
${this.companyBranding.contactInfo.address}
      `;
      brandedText += textSignature;
    }

    // Add text disclaimers
    if (options.includeDisclaimers && this.companyBranding?.disclaimers) {
      const textDisclaimers = `

IMPORTANT: ${this.companyBranding.disclaimers.join(' ')}
      `;
      brandedText += textDisclaimers;
    }

    return brandedText;
  }

  private processConditionals(content: string, variables: any): string {
    // Process {{#if variable}} blocks
    return content.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, block) => {
      const value = variables[variable];
      return value && value !== '' && value !== 'undefined' ? block : '';
    });
  }

  // Public API methods
  public updateCompanyBranding(branding: Partial<CompanyBranding>): void {
    if (this.companyBranding) {
      this.companyBranding = { ...this.companyBranding, ...branding };
      this.saveCompanyBranding();
    }
  }

  public updateBrandColors(colors: Partial<CompanyBranding['colors']>): void {
    if (this.companyBranding) {
      this.companyBranding.colors = { ...this.companyBranding.colors, ...colors };
      this.saveCompanyBranding();
    }
  }

  public updateEmailSignature(signature: Partial<CompanyBranding['emailSignature']>): void {
    if (this.companyBranding) {
      this.companyBranding.emailSignature = { ...this.companyBranding.emailSignature, ...signature };
      this.saveCompanyBranding();
    }
  }

  public uploadCompanyLogo(logoFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoDataUrl = event.target?.result as string;
        
        if (this.companyBranding) {
          this.companyBranding.logo.primary = logoDataUrl;
          this.saveCompanyBranding();
        }
        
        resolve(logoDataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(logoFile);
    });
  }

  public getCompanyBranding(): CompanyBranding | null {
    return this.companyBranding;
  }

  public generateEmailPreview(
    templateHTML: string,
    variables: { [key: string]: any },
    options: EmailBrandingOptions = {
      useCompanyLogo: true,
      useCompanyColors: true,
      includeSignature: true,
      includeFooter: true,
      includeDisclaimers: true,
      templateVariant: 'PROFESSIONAL'
    }
  ): string {
    const { html } = this.applyBrandingToTemplate(templateHTML, '', variables, options);
    return html;
  }

  // Brand color palette generator
  public generateColorPalette(primaryColor: string): CompanyBranding['colors'] {
    // Generate harmonious color palette from primary color
    const hsl = this.hexToHsl(primaryColor);
    
    return {
      primary: primaryColor,
      secondary: this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l), // 30° shift
      accent: this.hslToHex((hsl.h + 120) % 360, hsl.s, Math.min(hsl.l + 10, 90)), // Complementary
      success: '#059669',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#6B7280',
      background: '#F9FAFB',
      text: '#1F2937'
    };
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.substr(1, 2), 16) / 255;
    const g = parseInt(hex.substr(3, 2), 16) / 255;
    const b = parseInt(hex.substr(5, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Email template variants
  public getTemplateVariants(): { id: string; name: string; description: string; preview: string }[] {
    return [
      {
        id: 'PROFESSIONAL',
        name: 'Professional',
        description: 'Clean, corporate design with gradient headers and branded buttons',
        preview: 'professional-preview.png'
      },
      {
        id: 'MINIMAL',
        name: 'Minimal',
        description: 'Simple, clean design with minimal colors and maximum readability',
        preview: 'minimal-preview.png'
      },
      {
        id: 'BRANDED',
        name: 'Branded',
        description: 'Heavy brand integration with logos, colors, and custom styling',
        preview: 'branded-preview.png'
      },
      {
        id: 'CORPORATE',
        name: 'Corporate',
        description: 'Executive-level design with sophisticated styling and typography',
        preview: 'corporate-preview.png'
      }
    ];
  }

  // Accessibility and compliance
  public validateEmailAccessibility(htmlContent: string): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues = [];
    const recommendations = [];

    // Check for alt text on images
    if (htmlContent.includes('<img') && !htmlContent.includes('alt=')) {
      issues.push('Images missing alt text');
      recommendations.push('Add descriptive alt text to all images');
    }

    // Check color contrast (simplified)
    if (this.companyBranding) {
      const primaryColor = this.companyBranding.colors.primary;
      const textColor = this.companyBranding.colors.text;
      
      // Simplified contrast check
      if (this.getContrastRatio(primaryColor, textColor) < 4.5) {
        issues.push('Insufficient color contrast');
        recommendations.push('Increase contrast between text and background colors');
      }
    }

    // Check for proper heading structure
    if (!htmlContent.includes('<h1') && !htmlContent.includes('<h2')) {
      recommendations.push('Use proper heading tags (h1, h2) for better accessibility');
    }

    const score = Math.max(0, 100 - (issues.length * 20));

    return { score, issues, recommendations };
  }

  private getContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const brighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (brighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(hex: string): number {
    const rgb = parseInt(hex.substr(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  // Export/Import branding configuration
  public exportBrandingConfig(): string {
    return JSON.stringify(this.companyBranding, null, 2);
  }

  public importBrandingConfig(config: string): { success: boolean; error?: string } {
    try {
      const branding = JSON.parse(config);
      
      // Validate required fields
      if (!branding.companyName || !branding.colors || !branding.logo) {
        return { success: false, error: 'Invalid branding configuration' };
      }

      this.companyBranding = branding;
      this.saveCompanyBranding();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid JSON format' };
    }
  }
}

export default CompanyBrandingService;