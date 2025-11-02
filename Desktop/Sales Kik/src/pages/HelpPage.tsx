import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalNavigation from '../components/layout/UniversalNavigation';
import UniversalHeader from '../components/layout/UniversalHeader';
import { 
  MagnifyingGlassIcon, QuestionMarkCircleIcon, BookOpenIcon,
  UserGroupIcon, DocumentTextIcon, CubeIcon, CreditCardIcon,
  ShieldCheckIcon, CogIcon, ExclamationTriangleIcon, LightBulbIcon,
  ChevronDownIcon, ChevronUpIcon, PlayIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isVideo?: boolean;
}

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

  const toggleArticle = (articleId: string) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: PlayIcon,
      articles: [
        {
          id: 'login',
          title: 'How to Login',
          content: `**Admin Login:**
Use the admin credentials provided by your system administrator.

**Employee Login:**
Use the credentials provided by your administrator. Employee accounts are created by admins in the Employee Management section.

**Login Issues:**
• Make sure you're using the correct email and password
• Check if your account is active (employees can be deactivated by admins)
• Clear browser cache if experiencing login loops`,
          tags: ['login', 'password', 'admin', 'employee']
        },
        {
          id: 'dashboard',
          title: 'Understanding Your Dashboard',
          content: `**Admin Dashboard:**
Shows comprehensive business overview with:
• Quick access to all features
• Employee performance metrics
• Recent activity and notifications
• System configuration tools

**Employee Dashboard:**
Focused on daily tasks with:
• Personal metrics and targets
• Quick action buttons for common tasks
• Schedule and appointment overview
• Limited access based on permissions`,
          tags: ['dashboard', 'overview', 'metrics']
        },
        {
          id: 'navigation',
          title: 'Navigation Guide',
          content: `**Navigation Structure:**
• **SalesKik Logo:** Returns to main dashboard
• **Company Logo:** Takes you to profile (employees) or settings (admins)
• **Sidebar Menu:** Access to all features based on your permissions
• **Profile Dropdown:** Account settings, profile, and logout

**Permission-Based Menus:**
Different users see different menu items based on their assigned permissions.`,
          tags: ['navigation', 'menu', 'permissions']
        }
      ]
    },
    {
      id: 'user-roles',
      title: 'User Roles & Permissions',
      icon: UserGroupIcon,
      articles: [
        {
          id: 'admin-vs-employee',
          title: 'Admin vs Employee Access',
          content: `**Admin Users:**
• Full system access and control
• Can create and manage employee accounts
• Access to all features including purchase orders and product management
• Company settings and billing management
• User permission assignment

**Employee Users:**
• Limited access based on assigned permissions
• Default access to quotes, orders, invoices, and customers
• Cannot access sensitive areas like product management or purchase orders unless specifically granted
• Personal profile settings only`,
          tags: ['admin', 'employee', 'permissions', 'access']
        },
        {
          id: 'permission-system',
          title: 'Understanding Permissions',
          content: `**Permission Categories:**

**Core Business Operations (Default for Employees):**
• Quotes: Create and manage customer quotes
• Orders: Process customer orders
• Invoices: Generate and send invoices
• Customers: Manage customer relationships

**Admin-Controlled Permissions:**
• Product Management: Add/edit/delete products, view cost pricing
• Purchase Orders: Create and manage supplier orders
• User Management: Create employees and assign permissions
• Company Settings: Configure business rules and settings

**How to Grant Permissions:**
1. Go to Admin → Employee Management
2. Edit an employee
3. Check the specific permissions you want to grant
4. Save changes - permissions apply immediately`,
          tags: ['permissions', 'access control', 'employee management']
        },
        {
          id: 'employee-management',
          title: 'Managing Employee Accounts',
          content: `**Creating Employee Accounts:**
1. Navigate to Admin → Employees
2. Click "Add Employee"
3. Fill in personal information (name, email, phone, etc.)
4. Set position and department
5. Configure permissions carefully:
   • Core Business: Usually enabled for all employees
   • Product Management: Only for trusted employees
   • Purchase Orders: Only for procurement staff
   • Admin Access: Very rarely needed

**Permission Best Practices:**
• Start with default permissions (quotes, orders, invoices)
• Only grant additional permissions as needed
• Regularly review employee permissions
• Disable accounts for inactive employees`,
          tags: ['employee creation', 'permissions', 'security']
        }
      ]
    },
    {
      id: 'quotes-orders',
      title: 'Quotes & Orders',
      icon: DocumentTextIcon,
      articles: [
        {
          id: 'creating-quotes',
          title: 'Creating Customer Quotes',
          content: `**Quote Creation Process:**
1. Go to Quotes & Orders → New Quote
2. Select or create customer
3. Add products from inventory
4. Configure pricing and discounts
5. Add terms and conditions
6. Preview and send to customer

**Quote Features:**
• Product catalog integration
• Automatic pricing calculations
• Custom terms and conditions
• PDF generation for professional presentation
• Email delivery to customers
• Quote tracking and status updates`,
          tags: ['quotes', 'customers', 'pricing']
        },
        {
          id: 'quote-to-order',
          title: 'Converting Quotes to Orders',
          content: `**When Customer Accepts Quote:**
1. Open the accepted quote
2. Click "Convert to Order"
3. Review order details
4. Update delivery information if needed
5. Confirm order creation
6. Generate invoice if immediate payment required

**Order Management:**
• Track order status and progress
• Update delivery schedules
• Manage order modifications
• Generate shipping documentation`,
          tags: ['quotes', 'orders', 'conversion']
        }
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      icon: CubeIcon,
      articles: [
        {
          id: 'product-management',
          title: 'Managing Products (Admin Permission Required)',
          content: `**Adding Products:**
1. Navigate to Inventory → Product Management
2. Click "Add Product"
3. Enter product details (name, code, description)
4. Set pricing (cost and retail prices)
5. Assign to appropriate category
6. Upload product images if needed

**Product Features:**
• Product categories and subcategories
• Cost and retail price management
• Stock level tracking
• Product specifications and variants
• Supplier information and purchase history

**Important:** Product management requires admin permission. Regular employees cannot access this unless specifically granted permission.`,
          tags: ['products', 'inventory', 'admin', 'permissions']
        },
        {
          id: 'purchase-orders',
          title: 'Purchase Orders (Admin Permission Required)',
          content: `**Creating Purchase Orders:**
1. Navigate to Inventory → Purchase Orders
2. Click "Create Purchase Order"
3. Select supplier
4. Add products and quantities
5. Review pricing and terms
6. Submit for approval or processing

**Purchase Order Features:**
• Supplier management integration
• Automatic cost calculations
• Approval workflows
• Stock level updates upon receipt
• Purchase history tracking

**Important:** Purchase orders require admin permission for security. Only trusted employees should have access to supplier ordering.`,
          tags: ['purchase orders', 'suppliers', 'admin', 'permissions']
        },
        {
          id: 'stock-management',
          title: 'Stock Check & Management',
          content: `**Stock Operations:**
• Stock Check: View current inventory levels
• Receive Stock: Process incoming inventory
• Adjust Stock: Manual inventory adjustments
• Stock Takes: Periodic inventory counts
• Stock History: Track all inventory movements

**Best Practices:**
• Regular stock takes to maintain accuracy
• Prompt stock receipt processing
• Careful manual adjustments with notes
• Monitor low stock alerts`,
          tags: ['stock', 'inventory', 'tracking']
        }
      ]
    },
    {
      id: 'customers-suppliers',
      title: 'Customers & Suppliers',
      icon: UserGroupIcon,
      articles: [
        {
          id: 'customer-management',
          title: 'Managing Customers',
          content: `**Customer Features:**
• Customer profiles with contact information
• Credit limits and payment terms
• Purchase history and relationship tracking
• Customer-specific pricing and discounts
• Communication history and notes

**Creating Customers:**
1. Navigate to Customers
2. Click "Add Customer"
3. Enter business and contact details
4. Set credit limits and payment terms
5. Configure any special pricing arrangements

**Customer Best Practices:**
• Keep contact information updated
• Monitor credit limits and payment history
• Track customer preferences and requirements
• Maintain detailed communication logs`,
          tags: ['customers', 'relationships', 'credit']
        },
        {
          id: 'supplier-management',
          title: 'Managing Suppliers',
          content: `**Supplier Features:**
• Supplier profiles and contact information
• Product catalogs and pricing
• Purchase history and performance tracking
• Payment terms and conditions
• Performance metrics and ratings

**Working with Suppliers:**
• Maintain up-to-date contact information
• Track delivery performance and reliability
• Monitor pricing changes and negotiations
• Manage purchase orders and delivery schedules`,
          tags: ['suppliers', 'procurement', 'purchasing']
        }
      ]
    },
    {
      id: 'account-settings',
      title: 'Account & Security',
      icon: ShieldCheckIcon,
      articles: [
        {
          id: 'profile-settings',
          title: 'Managing Your Profile',
          content: `**Employee Profile Settings:**
• Update personal information (name, phone, department)
• Change your password securely
• View employment information
• Update contact details

**Admin Profile Settings:**
• Personal profile management
• Company settings and configuration
• Billing and subscription management
• System-wide configuration options

**Password Security:**
• Use strong passwords (12+ characters)
• Include uppercase, lowercase, numbers, and symbols
• Change passwords regularly
• Never share login credentials`,
          tags: ['profile', 'password', 'security']
        },
        {
          id: 'password-requirements',
          title: 'Password Security Requirements',
          content: `**Strong Password Requirements:**
✓ Minimum 12 characters long
✓ Contains uppercase letters (A-Z)
✓ Contains lowercase letters (a-z)  
✓ Contains numbers (0-9)
✓ Contains special characters (!@#$%^&*)
✓ No repeated characters or common patterns

**Password Best Practices:**
• Use unique passwords for each account
• Consider using a passphrase like "Coffee#Morning#2025!"
• Enable two-factor authentication when available
• Never share passwords with colleagues
• Change default passwords immediately

**Account Security:**
• Account locks after 5 failed login attempts
• Sessions timeout for security
• Regular password changes recommended`,
          tags: ['password', 'security', 'requirements']
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: ExclamationTriangleIcon,
      articles: [
        {
          id: 'login-issues',
          title: 'Login Problems',
          content: `**Cannot Login:**
• Verify your email and password are correct
• Check if your account is active (contact admin if employee)
• Clear browser cache and cookies
• Try a different browser
• Check if account is locked (wait 15 minutes after failed attempts)

**Redirected to Wrong Page:**
• Employees should go to Employee Dashboard
• Admins should go to Admin Dashboard
• Clear browser cache if experiencing routing issues

**"Unable to Connect to Server" Error:**
• Check internet connection
• Server may be temporarily down
• Try refreshing the page
• Contact system administrator if persistent`,
          tags: ['login', 'errors', 'troubleshooting']
        },
        {
          id: 'permission-issues',
          title: 'Permission and Access Issues',
          content: `**Cannot Access a Feature:**
• Check if you have the required permissions
• Contact your administrator to request access
• Verify your account is active
• Some features require admin approval

**Missing Menu Items:**
• Menu items are hidden based on your permissions
• Product Management: Admin permission required
• Purchase Orders: Admin permission required
• Company Settings: Admin only

**Permission Denied Messages:**
• You don't have permission for this action
• Contact administrator to request additional permissions
• Some actions are restricted for security reasons`,
          tags: ['permissions', 'access', 'errors']
        },
        {
          id: 'browser-issues',
          title: 'Browser and Performance Issues',
          content: `**Slow Performance:**
• Clear browser cache and cookies
• Close unnecessary browser tabs
• Disable browser extensions temporarily
• Try a different browser (Chrome, Firefox, Safari)

**Display Issues:**
• Refresh the page (F5 or Cmd+R)
• Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
• Check browser zoom level (should be 100%)
• Update your browser to latest version

**Data Not Updating:**
• Refresh the page
• Check internet connection
• Clear browser cache
• Sign out and back in`,
          tags: ['browser', 'performance', 'display']
        }
      ]
    },
    {
      id: 'features',
      title: 'Feature Guides',
      icon: LightBulbIcon,
      articles: [
        {
          id: 'employee-features',
          title: 'Employee Features Overview',
          content: `**Available to All Employees:**
• Create and manage quotes
• Process customer orders
• Generate invoices
• Manage customer relationships
• Access inventory information
• Personal profile management

**Admin-Controlled Features:**
• Product Management (add/edit/delete products)
• Purchase Orders (supplier ordering)
• Employee Management (create/manage users)
• Company Settings (business configuration)
• Billing and Subscription Management

**Getting More Access:**
If you need access to additional features, contact your administrator. They can grant specific permissions based on your role and responsibilities.`,
          tags: ['features', 'employee', 'access']
        },
        {
          id: 'admin-features',
          title: 'Administrator Features Overview',
          content: `**Employee Management:**
• Create and manage employee accounts
• Set granular permissions for each employee
• Monitor employee activity and performance
• Deactivate accounts when needed

**Business Configuration:**
• Company profile and branding
• Product catalog management
• Supplier and vendor management
• Pricing and discount management
• Invoice and document templates

**Security and Access:**
• User permission management
• Security settings and policies
• Data backup and recovery
• System configuration and maintenance`,
          tags: ['admin', 'features', 'management']
        },
        {
          id: 'billing',
          title: 'Billing and Subscriptions',
          content: `**Subscription Plans:**
• Starter: Basic features for small businesses
• Professional: Advanced features and integrations
• Enterprise: Full feature set with priority support

**Billing Management:**
• View current subscription status
• Update payment methods
• Access billing history
• Manage subscription changes

**Trial and Setup:**
• Most accounts start with a free trial
• Complete onboarding to activate features
• Configure business settings during setup`,
          tags: ['billing', 'subscription', 'payment']
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Best Practices',
      icon: ShieldCheckIcon,
      articles: [
        {
          id: 'account-security',
          title: 'Account Security Best Practices',
          content: `**Password Security:**
• Use unique, strong passwords (12+ characters)
• Never share login credentials
• Change passwords if you suspect compromise
• Use the built-in password strength validator

**Account Protection:**
• Log out when finished using the system
• Don't save passwords in shared browsers
• Report suspicious activity immediately
• Keep personal information updated

**Admin Security Responsibilities:**
• Regularly review employee permissions
• Deactivate accounts for departed employees
• Monitor system access and activity
• Maintain strong password policies`,
          tags: ['security', 'passwords', 'best practices']
        },
        {
          id: 'data-protection',
          title: 'Data Protection and Privacy',
          content: `**Data Security:**
• All data is encrypted in transit and at rest
• Regular automated backups protect your information
• Access controls prevent unauthorized data access
• Audit trails track all system activities

**Privacy Considerations:**
• Only collect necessary customer information
• Protect customer data according to privacy laws
• Limit employee access to need-to-know basis
• Regular data cleanup and maintenance

**Compliance:**
• Follow industry best practices for data protection
• Implement proper access controls
• Maintain data integrity and accuracy`,
          tags: ['data protection', 'privacy', 'compliance']
        }
      ]
    },
    {
      id: 'contact',
      title: 'Contact & Support',
      icon: QuestionMarkCircleIcon,
      articles: [
        {
          id: 'getting-help',
          title: 'Getting Additional Help',
          content: `**For Technical Issues:**
• Check this help section first
• Try basic troubleshooting steps
• Contact your system administrator
• Report bugs or issues to support team

**For Business Questions:**
• Contact your account manager
• Refer to business process documentation
• Reach out to the implementation team

**Emergency Support:**
• For critical system issues affecting business operations
• Data loss or security concerns
• Payment or billing emergencies`,
          tags: ['support', 'contact', 'help']
        },
        {
          id: 'feature-requests',
          title: 'Feature Requests and Feedback',
          content: `**Requesting New Features:**
• Document your business need clearly
• Explain how the feature would help your workflow
• Provide specific examples and use cases
• Submit through proper channels

**Providing Feedback:**
• Report any bugs or issues you encounter
• Suggest improvements to existing features
• Share your user experience insights
• Help make SalesKik better for everyone

**Beta Features:**
• Some features may be in beta testing
• Feedback is especially valuable for new features
• Report any issues with beta functionality`,
          tags: ['features', 'feedback', 'improvement']
        }
      ]
    }
  ];

  // Filter articles based on search term
  const filteredSections = helpSections.map(section => ({
    ...section,
    articles: section.articles.filter(article => 
      searchTerm === '' || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(section => section.articles.length > 0);

  return (
    <div className="min-h-screen bg-gray-50" style={{ isolation: 'isolate' }}>
      <UniversalNavigation 
        currentPage="help"
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)}
        onOpen={() => setShowSidebar(true)}
      />
      
      <div className={`transition-all duration-300 ${showSidebar ? 'lg:ml-64' : ''}`}>
        <UniversalHeader 
          title="Help & Support"
          subtitle="Find answers to common questions and learn how to use SalesKik effectively"
          onMenuClick={() => setShowSidebar(!showSidebar)}
        />
        
        <div className="p-6 max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search help articles..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {helpSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  activeSection === section.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <section.icon className={`w-6 h-6 ${
                    activeSection === section.id ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <h3 className={`font-semibold ${
                    activeSection === section.id ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {section.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {section.articles.length} article{section.articles.length !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>

          {/* Help Content */}
          <div className="space-y-6">
            {filteredSections.map((section) => (
              <div key={section.id} className={`${activeSection === 'all' || activeSection === section.id ? 'block' : 'hidden'}`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <section.icon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>

                  <div className="space-y-4">
                    {section.articles.map((article) => (
                      <div key={article.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleArticle(article.id)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {article.isVideo && <PlayIcon className="w-5 h-5 text-green-600" />}
                            <h3 className="font-semibold text-gray-900">{article.title}</h3>
                          </div>
                          {expandedArticles.has(article.id) ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        
                        {expandedArticles.has(article.id) && (
                          <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-200">
                            <div className="prose max-w-none">
                              {article.content.split('\n').map((line, index) => {
                                if (line.startsWith('**') && line.endsWith('**')) {
                                  return (
                                    <h4 key={index} className="font-semibold text-gray-900 mt-4 mb-2">
                                      {line.replace(/\*\*/g, '')}
                                    </h4>
                                  );
                                }
                                if (line.startsWith('•')) {
                                  return (
                                    <div key={index} className="flex items-start gap-2 mb-1">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span className="text-gray-700">{line.substring(1).trim()}</span>
                                    </div>
                                  );
                                }
                                if (line.startsWith('✓')) {
                                  return (
                                    <div key={index} className="flex items-start gap-2 mb-1">
                                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-700">{line.substring(1).trim()}</span>
                                    </div>
                                  );
                                }
                                if (line.trim() === '') {
                                  return <br key={index} />;
                                }
                                return (
                                  <p key={index} className="text-gray-700 mb-2">
                                    {line}
                                  </p>
                                );
                              })}
                            </div>
                            
                            {/* Article Tags */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                              {article.tags.map((tag) => (
                                <span 
                                  key={tag}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {/* No Results */}
            {filteredSections.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <QuestionMarkCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600">
                  Try different search terms or browse the categories above.
                </p>
              </div>
            )}
          </div>

          {/* Quick Contact Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help you get the most out of SalesKik.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.open('mailto:support@saleskik.com', '_blank')}
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Email Support
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Contact Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;