// Internationalization Service for Purchase Order System
// i18n framework, language switching, localized text management, and formatting

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export interface LanguageConfig {
  code: string; // ISO 639-1 language code
  name: string; // Native language name
  englishName: string;
  region: string; // ISO 3166-1 country code
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currencyFormat: {
    symbol: string;
    position: 'before' | 'after';
    decimals: number;
    thousandsSeparator: string;
    decimalSeparator: string;
  };
  numberFormat: {
    decimals: number;
    thousandsSeparator: string;
    decimalSeparator: string;
  };
  isActive: boolean;
  completionPercentage: number; // Translation completion
  lastUpdated: Date;
}

export interface TranslationKey {
  key: string;
  namespace: string;
  context?: string;
  description?: string;
  defaultValue: string;
  placeholders?: string[];
  category: 'UI' | 'BUSINESS' | 'ERROR' | 'EMAIL' | 'NOTIFICATION' | 'REPORT';
  isPlural?: boolean;
  pluralForms?: { [count: string]: string };
}

export interface LocaleSpecificBusinessRule {
  id: string;
  locale: string;
  ruleName: string;
  ruleType: 'CURRENCY_FORMAT' | 'DATE_FORMAT' | 'TAX_CALCULATION' | 'PAYMENT_TERMS' | 'LEGAL_REQUIREMENT';
  configuration: {
    [key: string]: any;
  };
  isActive: boolean;
}

class InternationalizationService {
  private static instance: InternationalizationService;
  private supportedLanguages: Map<string, LanguageConfig> = new Map();
  private translationKeys: Map<string, TranslationKey> = new Map();
  private localeBusinessRules: Map<string, LocaleSpecificBusinessRule[]> = new Map();
  private currentLocale: string = 'en-AU';

  private constructor() {
    this.initializeSupportedLanguages();
    this.initializeTranslationKeys();
    this.initializeLocaleBusinessRules();
    this.configureI18n();
  }

  public static getInstance(): InternationalizationService {
    if (!InternationalizationService.instance) {
      InternationalizationService.instance = new InternationalizationService();
    }
    return InternationalizationService.instance;
  }

  private initializeSupportedLanguages(): void {
    const languages: LanguageConfig[] = [
      {
        code: 'en-AU',
        name: 'English (Australia)',
        englishName: 'English (Australia)',
        region: 'AU',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currencyFormat: {
          symbol: '$',
          position: 'before',
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        numberFormat: {
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        isActive: true,
        completionPercentage: 100,
        lastUpdated: new Date()
      },
      {
        code: 'en-US',
        name: 'English (United States)',
        englishName: 'English (United States)',
        region: 'US',
        direction: 'ltr',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'HH:mm',
        currencyFormat: {
          symbol: '$',
          position: 'before',
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        numberFormat: {
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        isActive: true,
        completionPercentage: 95,
        lastUpdated: new Date()
      },
      {
        code: 'zh-CN',
        name: '中文 (简体)',
        englishName: 'Chinese (Simplified)',
        region: 'CN',
        direction: 'ltr',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: 'HH:mm',
        currencyFormat: {
          symbol: '¥',
          position: 'before',
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        numberFormat: {
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        isActive: true,
        completionPercentage: 75,
        lastUpdated: new Date()
      },
      {
        code: 'es-ES',
        name: 'Español',
        englishName: 'Spanish',
        region: 'ES',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currencyFormat: {
          symbol: '€',
          position: 'after',
          decimals: 2,
          thousandsSeparator: '.',
          decimalSeparator: ','
        },
        numberFormat: {
          decimals: 2,
          thousandsSeparator: '.',
          decimalSeparator: ','
        },
        isActive: true,
        completionPercentage: 60,
        lastUpdated: new Date()
      },
      {
        code: 'ar-SA',
        name: 'العربية',
        englishName: 'Arabic',
        region: 'SA',
        direction: 'rtl',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currencyFormat: {
          symbol: 'ر.س',
          position: 'after',
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        numberFormat: {
          decimals: 2,
          thousandsSeparator: ',',
          decimalSeparator: '.'
        },
        isActive: true,
        completionPercentage: 45,
        lastUpdated: new Date()
      }
    ];

    languages.forEach(lang => {
      this.supportedLanguages.set(lang.code, lang);
    });
  }

  private initializeTranslationKeys(): void {
    const translationKeys: TranslationKey[] = [
      // Purchase Order UI
      {
        key: 'purchaseOrders.title',
        namespace: 'purchaseOrders',
        defaultValue: 'Purchase Orders',
        description: 'Main page title for purchase orders',
        category: 'UI'
      },
      {
        key: 'purchaseOrders.create.title',
        namespace: 'purchaseOrders',
        defaultValue: 'Create Purchase Order',
        description: 'Title for purchase order creation page',
        category: 'UI'
      },
      {
        key: 'purchaseOrders.status.draft',
        namespace: 'purchaseOrders',
        defaultValue: 'Draft',
        description: 'Purchase order status: Draft',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.status.pendingApproval',
        namespace: 'purchaseOrders',
        defaultValue: 'Pending Approval',
        description: 'Purchase order status: Pending Approval',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.status.approved',
        namespace: 'purchaseOrders',
        defaultValue: 'Approved',
        description: 'Purchase order status: Approved',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.status.sentToSupplier',
        namespace: 'purchaseOrders',
        defaultValue: 'Sent to Supplier',
        description: 'Purchase order status: Sent to Supplier',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.status.supplierConfirmed',
        namespace: 'purchaseOrders',
        defaultValue: 'Supplier Confirmed',
        description: 'Purchase order status: Supplier Confirmed',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.priority.normal',
        namespace: 'purchaseOrders',
        defaultValue: 'Normal',
        description: 'Priority level: Normal',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.priority.high',
        namespace: 'purchaseOrders',
        defaultValue: 'High',
        description: 'Priority level: High',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.priority.urgent',
        namespace: 'purchaseOrders',
        defaultValue: 'Urgent',
        description: 'Priority level: Urgent',
        category: 'BUSINESS'
      },
      {
        key: 'purchaseOrders.form.supplier',
        namespace: 'purchaseOrders',
        defaultValue: 'Supplier',
        description: 'Form label for supplier selection',
        category: 'UI'
      },
      {
        key: 'purchaseOrders.form.totalAmount',
        namespace: 'purchaseOrders',
        defaultValue: 'Total Amount',
        description: 'Form label for total amount',
        category: 'UI'
      },
      {
        key: 'purchaseOrders.validation.supplierRequired',
        namespace: 'purchaseOrders',
        defaultValue: 'Please select a supplier',
        description: 'Validation error for missing supplier',
        category: 'ERROR'
      },
      {
        key: 'purchaseOrders.validation.lineItemsRequired',
        namespace: 'purchaseOrders',
        defaultValue: 'At least one line item is required',
        description: 'Validation error for missing line items',
        category: 'ERROR'
      },
      // Email Templates
      {
        key: 'email.supplierOrder.subject',
        namespace: 'email',
        defaultValue: 'Purchase Order from {{companyName}} - {{orderNumber}}',
        description: 'Email subject for supplier order notification',
        placeholders: ['companyName', 'orderNumber'],
        category: 'EMAIL'
      },
      {
        key: 'email.supplierOrder.greeting',
        namespace: 'email',
        defaultValue: 'Dear {{supplierName}},',
        description: 'Email greeting for supplier notifications',
        placeholders: ['supplierName'],
        category: 'EMAIL'
      },
      {
        key: 'email.approvalRequired.subject',
        namespace: 'email',
        defaultValue: 'Approval Required: {{orderNumber}} - {{amount}}',
        description: 'Email subject for approval requests',
        placeholders: ['orderNumber', 'amount'],
        category: 'EMAIL'
      },
      // Notifications
      {
        key: 'notifications.orderCreated',
        namespace: 'notifications',
        defaultValue: 'Purchase order {{orderNumber}} created',
        description: 'Notification for order creation',
        placeholders: ['orderNumber'],
        category: 'NOTIFICATION'
      },
      {
        key: 'notifications.approvalRequired',
        namespace: 'notifications',
        defaultValue: 'Approval required for order {{orderNumber}}',
        description: 'Notification for approval requirement',
        placeholders: ['orderNumber'],
        category: 'NOTIFICATION'
      },
      {
        key: 'notifications.count',
        namespace: 'notifications',
        defaultValue: '{{count}} notification',
        description: 'Notification count with pluralization',
        category: 'NOTIFICATION',
        isPlural: true,
        pluralForms: {
          '0': 'No notifications',
          '1': '{{count}} notification',
          'other': '{{count}} notifications'
        }
      }
    ];

    translationKeys.forEach(key => {
      this.translationKeys.set(key.key, key);
    });
  }

  private initializeLocaleBusinessRules(): void {
    // Australian business rules
    const australianRules: LocaleSpecificBusinessRule[] = [
      {
        id: 'au-tax-gst',
        locale: 'en-AU',
        ruleName: 'GST Tax Calculation',
        ruleType: 'TAX_CALCULATION',
        configuration: {
          taxRate: 0.10,
          taxName: 'GST',
          taxIncluded: false,
          exemptCategories: ['export', 'financial-services']
        },
        isActive: true
      },
      {
        id: 'au-payment-terms',
        locale: 'en-AU',
        ruleName: 'Standard Payment Terms',
        ruleType: 'PAYMENT_TERMS',
        configuration: {
          defaultTerms: 'Net 30',
          availableTerms: ['Net 7', 'Net 14', 'Net 30', 'Net 60', 'COD', 'EOM']
        },
        isActive: true
      },
      {
        id: 'au-currency-format',
        locale: 'en-AU',
        ruleName: 'Australian Dollar Formatting',
        ruleType: 'CURRENCY_FORMAT',
        configuration: {
          symbol: '$',
          code: 'AUD',
          position: 'before',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        },
        isActive: true
      }
    ];

    // US business rules
    const usRules: LocaleSpecificBusinessRule[] = [
      {
        id: 'us-tax-sales',
        locale: 'en-US',
        ruleName: 'Sales Tax Calculation',
        ruleType: 'TAX_CALCULATION',
        configuration: {
          taxRate: 0.0875, // Average US sales tax
          taxName: 'Sales Tax',
          taxIncluded: false,
          stateSpecific: true
        },
        isActive: true
      },
      {
        id: 'us-currency-format',
        locale: 'en-US',
        ruleName: 'US Dollar Formatting',
        ruleType: 'CURRENCY_FORMAT',
        configuration: {
          symbol: '$',
          code: 'USD',
          position: 'before',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        },
        isActive: true
      }
    ];

    // Chinese business rules
    const chineseRules: LocaleSpecificBusinessRule[] = [
      {
        id: 'cn-currency-format',
        locale: 'zh-CN',
        ruleName: 'Chinese Yuan Formatting',
        ruleType: 'CURRENCY_FORMAT',
        configuration: {
          symbol: '¥',
          code: 'CNY',
          position: 'before',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        },
        isActive: true
      },
      {
        id: 'cn-date-format',
        locale: 'zh-CN',
        ruleName: 'Chinese Date Format',
        ruleType: 'DATE_FORMAT',
        configuration: {
          dateFormat: 'YYYY年MM月DD日',
          timeFormat: 'HH:mm',
          weekStartsOn: 1 // Monday
        },
        isActive: true
      }
    ];

    this.localeBusinessRules.set('en-AU', australianRules);
    this.localeBusinessRules.set('en-US', usRules);
    this.localeBusinessRules.set('zh-CN', chineseRules);
  }

  private async configureI18n(): Promise<void> {
    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        lng: this.currentLocale,
        fallbackLng: 'en-AU',
        debug: process.env.NODE_ENV === 'development',
        
        interpolation: {
          escapeValue: false // React already escapes values
        },

        detection: {
          order: ['localStorage', 'navigator', 'htmlTag'],
          caches: ['localStorage'],
          lookupLocalStorage: 'saleskik-language'
        },

        resources: await this.loadTranslationResources(),

        react: {
          bindI18n: 'languageChanged',
          bindI18nStore: '',
          transEmptyNodeValue: '',
          transSupportBasicHtmlNodes: true,
          transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em']
        }
      });

    console.log('i18n initialized with locale:', this.currentLocale);
  }

  private async loadTranslationResources(): Promise<any> {
    const resources: any = {};

    // Load translations for each supported language
    for (const [locale, langConfig] of this.supportedLanguages) {
      if (!langConfig.isActive) continue;

      resources[locale] = {
        purchaseOrders: await this.loadNamespaceTranslations('purchaseOrders', locale),
        common: await this.loadNamespaceTranslations('common', locale),
        email: await this.loadNamespaceTranslations('email', locale),
        notifications: await this.loadNamespaceTranslations('notifications', locale),
        errors: await this.loadNamespaceTranslations('errors', locale)
      };
    }

    return resources;
  }

  private async loadNamespaceTranslations(namespace: string, locale: string): Promise<any> {
    // In production, load from translation files or API
    const translations: any = {};

    const namespaceKeys = Array.from(this.translationKeys.values())
      .filter(key => key.namespace === namespace);

    // Create base translations (en-AU)
    if (locale === 'en-AU') {
      namespaceKeys.forEach(key => {
        const keyPath = key.key.split('.').slice(1).join('.'); // Remove namespace prefix
        this.setNestedValue(translations, keyPath, key.defaultValue);
      });
    } else {
      // Load localized translations (simulate)
      const localizedTranslations = await this.getLocalizedTranslations(namespace, locale);
      Object.assign(translations, localizedTranslations);
    }

    return translations;
  }

  private async getLocalizedTranslations(namespace: string, locale: string): Promise<any> {
    // Simulate loading translations for different locales
    const translations: any = {};

    if (namespace === 'purchaseOrders') {
      switch (locale) {
        case 'zh-CN':
          return {
            title: '采购订单',
            create: { title: '创建采购订单' },
            status: {
              draft: '草稿',
              pendingApproval: '待审批',
              approved: '已批准',
              sentToSupplier: '已发送给供应商',
              supplierConfirmed: '供应商已确认'
            },
            priority: {
              normal: '普通',
              high: '高',
              urgent: '紧急'
            },
            form: {
              supplier: '供应商',
              totalAmount: '总金额'
            },
            validation: {
              supplierRequired: '请选择供应商',
              lineItemsRequired: '至少需要一个商品项目'
            }
          };
        
        case 'es-ES':
          return {
            title: 'Órdenes de Compra',
            create: { title: 'Crear Orden de Compra' },
            status: {
              draft: 'Borrador',
              pendingApproval: 'Pendiente de Aprobación',
              approved: 'Aprobado',
              sentToSupplier: 'Enviado al Proveedor',
              supplierConfirmed: 'Confirmado por Proveedor'
            },
            priority: {
              normal: 'Normal',
              high: 'Alto',
              urgent: 'Urgente'
            },
            form: {
              supplier: 'Proveedor',
              totalAmount: 'Monto Total'
            },
            validation: {
              supplierRequired: 'Por favor seleccione un proveedor',
              lineItemsRequired: 'Se requiere al menos un artículo'
            }
          };
        
        case 'ar-SA':
          return {
            title: 'أوامر الشراء',
            create: { title: 'إنشاء أمر شراء' },
            status: {
              draft: 'مسودة',
              pendingApproval: 'في انتظار الموافقة',
              approved: 'موافق عليه',
              sentToSupplier: 'أرسل إلى المورد',
              supplierConfirmed: 'مؤكد من المورد'
            },
            priority: {
              normal: 'عادي',
              high: 'عالي',
              urgent: 'عاجل'
            },
            form: {
              supplier: 'المورد',
              totalAmount: 'المبلغ الإجمالي'
            },
            validation: {
              supplierRequired: 'يرجى اختيار مورد',
              lineItemsRequired: 'مطلوب عنصر واحد على الأقل'
            }
          };
      }
    }

    // Return default English if no translation available
    const namespaceKeys = Array.from(this.translationKeys.values())
      .filter(key => key.namespace === namespace);

    namespaceKeys.forEach(key => {
      const keyPath = key.key.split('.').slice(1).join('.');
      this.setNestedValue(translations, keyPath, key.defaultValue);
    });

    return translations;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  // Language switching
  public async changeLanguage(locale: string): Promise<{ success: boolean; error?: string }> {
    const langConfig = this.supportedLanguages.get(locale);
    if (!langConfig || !langConfig.isActive) {
      return { success: false, error: `Language ${locale} not supported or inactive` };
    }

    try {
      await i18n.changeLanguage(locale);
      this.currentLocale = locale;
      
      // Update document direction for RTL languages
      document.documentElement.dir = langConfig.direction;
      document.documentElement.lang = locale;
      
      // Store preference
      localStorage.setItem('saleskik-language', locale);
      
      // Update business rules
      this.applyLocaleBusinessRules(locale);
      
      // Broadcast language change event
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { locale } }));
      
      console.log(`Language changed to: ${langConfig.name}`);
      return { success: true };
    } catch (error) {
      console.error('Language change failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Localized formatting
  public formatCurrency(amount: number, locale?: string): string {
    const langConfig = this.supportedLanguages.get(locale || this.currentLocale);
    if (!langConfig) return amount.toString();

    const formatter = new Intl.NumberFormat(locale || this.currentLocale, {
      style: 'currency',
      currency: this.getCurrencyCode(locale || this.currentLocale),
      minimumFractionDigits: langConfig.currencyFormat.decimals,
      maximumFractionDigits: langConfig.currencyFormat.decimals
    });

    return formatter.format(amount);
  }

  public formatDate(date: Date, locale?: string): string {
    const langConfig = this.supportedLanguages.get(locale || this.currentLocale);
    if (!langConfig) return date.toLocaleDateString();

    const formatter = new Intl.DateTimeFormat(locale || this.currentLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    return formatter.format(date);
  }

  public formatDateTime(date: Date, locale?: string): string {
    const langConfig = this.supportedLanguages.get(locale || this.currentLocale);
    if (!langConfig) return date.toLocaleString();

    const formatter = new Intl.DateTimeFormat(locale || this.currentLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return formatter.format(date);
  }

  public formatNumber(number: number, locale?: string): string {
    const langConfig = this.supportedLanguages.get(locale || this.currentLocale);
    if (!langConfig) return number.toString();

    const formatter = new Intl.NumberFormat(locale || this.currentLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: langConfig.numberFormat.decimals
    });

    return formatter.format(number);
  }

  // Business rule application
  private applyLocaleBusinessRules(locale: string): void {
    const rules = this.localeBusinessRules.get(locale) || [];
    
    rules.forEach(rule => {
      if (rule.isActive) {
        this.applyBusinessRule(rule);
      }
    });
  }

  private applyBusinessRule(rule: LocaleSpecificBusinessRule): void {
    switch (rule.ruleType) {
      case 'CURRENCY_FORMAT':
        // Update currency formatting globally
        document.documentElement.setAttribute('data-currency-symbol', rule.configuration.symbol);
        document.documentElement.setAttribute('data-currency-code', rule.configuration.code);
        break;
      
      case 'DATE_FORMAT':
        // Update date formatting preferences
        document.documentElement.setAttribute('data-date-format', rule.configuration.dateFormat);
        break;
      
      case 'TAX_CALCULATION':
        // Update tax calculation rules
        localStorage.setItem('saleskik-tax-config', JSON.stringify(rule.configuration));
        break;
    }
  }

  private getCurrencyCode(locale: string): string {
    const langConfig = this.supportedLanguages.get(locale);
    
    const currencyMap: { [locale: string]: string } = {
      'en-AU': 'AUD',
      'en-US': 'USD',
      'zh-CN': 'CNY',
      'es-ES': 'EUR',
      'ar-SA': 'SAR'
    };

    return currencyMap[locale] || 'AUD';
  }

  // Translation management
  public addTranslationKey(key: TranslationKey): void {
    this.translationKeys.set(key.key, key);
    
    // Add to i18n resources
    i18n.addResource(this.currentLocale, key.namespace, key.key.split('.').slice(1).join('.'), key.defaultValue);
  }

  public updateTranslation(locale: string, namespace: string, key: string, value: string): void {
    i18n.addResource(locale, namespace, key, value);
    
    // Save to storage
    const translations = JSON.parse(localStorage.getItem(`saleskik-translations-${locale}`) || '{}');
    this.setNestedValue(translations, `${namespace}.${key}`, value);
    localStorage.setItem(`saleskik-translations-${locale}`, JSON.stringify(translations));
  }

  // Public API methods
  public getSupportedLanguages(): LanguageConfig[] {
    return Array.from(this.supportedLanguages.values())
      .filter(lang => lang.isActive)
      .sort((a, b) => b.completionPercentage - a.completionPercentage);
  }

  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  public getCurrentLanguageConfig(): LanguageConfig | null {
    return this.supportedLanguages.get(this.currentLocale) || null;
  }

  public getTranslationKeys(namespace?: string): TranslationKey[] {
    const keys = Array.from(this.translationKeys.values());
    return namespace ? keys.filter(key => key.namespace === namespace) : keys;
  }

  public getLocaleBusinessRules(locale?: string): LocaleSpecificBusinessRule[] {
    return this.localeBusinessRules.get(locale || this.currentLocale) || [];
  }

  public getTranslationCompleteness(locale: string): {
    totalKeys: number;
    translatedKeys: number;
    completionPercentage: number;
    missingKeys: string[];
  } {
    const totalKeys = this.translationKeys.size;
    const resources = i18n.getResourceBundle(locale, 'purchaseOrders') || {};
    
    const translatedKeys = this.countTranslatedKeys(resources);
    const completionPercentage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;
    
    const missingKeys = Array.from(this.translationKeys.keys())
      .filter(key => !this.hasTranslation(locale, key));

    return {
      totalKeys,
      translatedKeys,
      completionPercentage,
      missingKeys
    };
  }

  private countTranslatedKeys(obj: any, count = 0): number {
    Object.values(obj).forEach(value => {
      if (typeof value === 'string') {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        count = this.countTranslatedKeys(value, count);
      }
    });
    return count;
  }

  private hasTranslation(locale: string, key: string): boolean {
    const translationKey = this.translationKeys.get(key);
    if (!translationKey) return false;

    const translation = i18n.getResource(locale, translationKey.namespace, key.split('.').slice(1).join('.'));
    return translation !== undefined && translation !== translationKey.defaultValue;
  }

  // Export/Import translations
  public exportTranslations(locale: string): { success: boolean; data?: string; error?: string } {
    try {
      const langConfig = this.supportedLanguages.get(locale);
      if (!langConfig) {
        return { success: false, error: 'Language not found' };
      }

      const exportData = {
        language: langConfig,
        translations: i18n.getResourceBundle(locale, 'purchaseOrders'),
        businessRules: this.localeBusinessRules.get(locale) || [],
        exportedAt: new Date(),
        version: '1.0.0'
      };

      return { success: true, data: JSON.stringify(exportData, null, 2) };
    } catch (error) {
      console.error('Translation export failed:', error);
      return { success: false, error: error.message };
    }
  }

  public importTranslations(locale: string, translationData: string): { success: boolean; imported: number; error?: string } {
    try {
      const data = JSON.parse(translationData);
      let imported = 0;

      Object.entries(data.translations || {}).forEach(([namespace, translations]) => {
        Object.entries(translations as any).forEach(([key, value]) => {
          i18n.addResource(locale, namespace, key, value);
          imported++;
        });
      });

      // Update business rules if provided
      if (data.businessRules) {
        this.localeBusinessRules.set(locale, data.businessRules);
      }

      console.log(`Imported ${imported} translations for ${locale}`);
      return { success: true, imported };
    } catch (error) {
      console.error('Translation import failed:', error);
      return { success: false, imported: 0, error: error.message };
    }
  }
}

export default InternationalizationService;