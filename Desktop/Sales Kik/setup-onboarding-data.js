// Setup script for onboarding system data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOnboardingData() {
  console.log('🚀 Setting up onboarding system data...');

  try {
    // Create system modules
    const modules = [
      // Core modules (required for all companies)
      {
        name: 'Customer Management',
        description: 'Manage customer relationships, contacts, and communication',
        category: 'UNIVERSAL',
        is_core: true,
        pricing_tier: 'BASIC'
      },
      {
        name: 'Product Catalog',
        description: 'Product and inventory management with pricing tiers',
        category: 'UNIVERSAL',
        is_core: true,
        pricing_tier: 'BASIC'
      },
      {
        name: 'Quote System',
        description: 'Create and manage professional quotes',
        category: 'UNIVERSAL',
        is_core: true,
        pricing_tier: 'BASIC'
      },
      {
        name: 'Order Management',
        description: 'Process and track customer orders',
        category: 'UNIVERSAL',
        is_core: true,
        pricing_tier: 'BASIC'
      },
      {
        name: 'Invoice System',
        description: 'Generate and manage invoices with payment tracking',
        category: 'UNIVERSAL',
        is_core: true,
        pricing_tier: 'BASIC'
      },
      
      // Tradies-specific modules
      {
        name: 'Glass Module',
        description: 'Specialized glass industry features and calculations',
        category: 'TRADIES',
        is_core: false,
        pricing_tier: 'PREMIUM'
      },
      {
        name: 'Job Scheduling',
        description: 'Schedule and track jobs with resource management',
        category: 'TRADIES',
        is_core: false,
        pricing_tier: 'PREMIUM'
      },
      {
        name: 'Mobile App',
        description: 'Access SalesKik on mobile devices',
        category: 'TRADIES',
        is_core: false,
        pricing_tier: 'PREMIUM'
      },
      {
        name: 'Field Reports',
        description: 'Generate reports from job sites',
        category: 'TRADIES',
        is_core: false,
        pricing_tier: 'ADVANCED'
      },
      
      // SME-specific modules  
      {
        name: 'Advanced Reporting',
        description: 'Business intelligence and analytics dashboard',
        category: 'SME',
        is_core: false,
        pricing_tier: 'PREMIUM'
      },
      {
        name: 'Multi-Location',
        description: 'Manage multiple warehouses and locations',
        category: 'SME',
        is_core: false,
        pricing_tier: 'PREMIUM'
      },
      {
        name: 'Team Management',
        description: 'Advanced user roles and permissions',
        category: 'SME',
        is_core: false,
        pricing_tier: 'ADVANCED'
      },
      {
        name: 'API Access',
        description: 'REST API for third-party integrations',
        category: 'SME',
        is_core: false,
        pricing_tier: 'ENTERPRISE'
      }
    ];

    console.log('📦 Creating system modules...');
    for (const module of modules) {
      await prisma.systemModule.upsert({
        where: { name: module.name },
        update: module,
        create: module
      });
    }
    console.log(`✅ Created/updated ${modules.length} system modules`);

    // Create default email templates
    const emailTemplates = [
      {
        template_key: 'welcome',
        subject: 'Welcome to SalesKik!',
        html_content: `
          <h1>Welcome to SalesKik!</h1>
          <p>Hi {{firstName}},</p>
          <p>Welcome to your new business management platform. Your company <strong>{{companyName}}</strong> is now set up and ready to go!</p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>Complete your product catalog setup</li>
            <li>Add your first customers</li>
            <li>Create your first quote</li>
          </ul>
          <p>If you need help, our support team is here for you.</p>
          <p>Best regards,<br>The SalesKik Team</p>
        `,
        text_content: 'Welcome to SalesKik! Your account is ready.'
      },
      {
        template_key: 'trial_expiring',
        subject: 'Your SalesKik trial is expiring soon',
        html_content: `
          <h1>Trial Expiring Soon</h1>
          <p>Hi {{firstName}},</p>
          <p>Your SalesKik trial for <strong>{{companyName}}</strong> expires in {{daysRemaining}} days.</p>
          <p>To continue using SalesKik without interruption, please upgrade your account.</p>
          <p><a href="{{upgradeUrl}}">Upgrade Now</a></p>
        `,
        text_content: 'Your SalesKik trial is expiring soon. Please upgrade to continue.'
      },
      {
        template_key: 'onboarding_complete',
        subject: 'Onboarding Complete - You\'re Ready to Go!',
        html_content: `
          <h1>Onboarding Complete!</h1>
          <p>Hi {{firstName}},</p>
          <p>Congratulations! You've successfully completed the onboarding process for <strong>{{companyName}}</strong>.</p>
          <p>Your selected modules are now active:</p>
          <ul>{{modulesList}}</ul>
          <p>Start managing your business with SalesKik today!</p>
        `,
        text_content: 'Onboarding complete! Your SalesKik account is ready to use.'
      }
    ];

    console.log('📧 Creating email templates...');
    for (const template of emailTemplates) {
      await prisma.emailTemplate.upsert({
        where: { template_key: template.template_key },
        update: template,
        create: template
      });
    }
    console.log(`✅ Created/updated ${emailTemplates.length} email templates`);

    // Create default company settings templates
    const defaultSettings = [
      { key: 'business_hours', value: { start: '09:00', end: '17:00', timezone: 'Australia/Sydney' } },
      { key: 'currency', value: { code: 'AUD', symbol: '$' } },
      { key: 'tax_rate', value: { gst: 0.10 } },
      { key: 'invoice_terms', value: { payment_days: 30, late_fee: 0.05 } },
      { key: 'quote_validity', value: { days: 30 } },
      { key: 'auto_notifications', value: { trial_expiring: true, payment_overdue: true } }
    ];

    console.log('⚙️ Default company settings configured');
    console.log('✅ Onboarding system data setup complete!');

    // Display summary
    const moduleCount = await prisma.systemModule.count();
    const templateCount = await prisma.emailTemplate.count();
    
    console.log('\n📊 Summary:');
    console.log(`   System Modules: ${moduleCount}`);
    console.log(`   Email Templates: ${templateCount}`);
    console.log('   Default Settings: 6 types configured');
    console.log('\n🎯 Ready for onboarding: Companies can now sign up and select modules!');

  } catch (error) {
    console.error('❌ Error setting up onboarding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOnboardingData();