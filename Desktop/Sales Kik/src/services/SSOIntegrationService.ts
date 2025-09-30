// SSO Integration Service for Purchase Order System
// SAML 2.0, OAuth 2.0/OpenID Connect, Active Directory integration

export interface SSOProvider {
  id: string;
  name: string;
  type: 'SAML' | 'OAUTH2' | 'OPENID_CONNECT' | 'ACTIVE_DIRECTORY';
  configuration: {
    // SAML Configuration
    entityId?: string;
    ssoServiceUrl?: string;
    x509Certificate?: string;
    signatureAlgorithm?: string;
    digestAlgorithm?: string;
    
    // OAuth 2.0 Configuration
    clientId?: string;
    clientSecret?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    scope?: string[];
    
    // Active Directory Configuration
    domain?: string;
    ldapUrl?: string;
    baseDN?: string;
    bindDN?: string;
    bindPassword?: string;
    searchFilter?: string;
    
    // Common Configuration
    callbackUrl?: string;
    logoutUrl?: string;
    userAttributeMapping?: {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      department: string;
    };
  };
  roleMapping: {
    [externalRole: string]: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'WAREHOUSE_STAFF' | 'ACCOUNTING';
  };
  userProvisioning: {
    autoCreateUsers: boolean;
    autoUpdateUsers: boolean;
    defaultRole: string;
    requiredAttributes: string[];
  };
  isActive: boolean;
  priority: number; // Higher number = higher priority
  createdAt: Date;
  updatedAt: Date;
}

export interface SSOSession {
  id: string;
  userId: string;
  providerId: string;
  providerType: string;
  externalUserId: string;
  sessionToken: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  userAttributes: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    [key: string]: any;
  };
  mfaVerified: boolean;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

export interface MFAConfiguration {
  enabled: boolean;
  methods: Array<{
    type: 'TOTP' | 'SMS' | 'EMAIL' | 'HARDWARE_TOKEN';
    isRequired: boolean;
    configuration: {
      issuer?: string;
      totpSecret?: string;
      smsProvider?: string;
      phoneNumber?: string;
      emailAddress?: string;
    };
  }>;
  backupCodes: string[];
  lastMFAAt?: Date;
}

export interface UserProvisioningResult {
  success: boolean;
  userId?: string;
  action: 'CREATED' | 'UPDATED' | 'FOUND' | 'BLOCKED';
  warnings: string[];
  errors: string[];
  userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  };
}

class SSOIntegrationService {
  private static instance: SSOIntegrationService;
  private ssoProviders: Map<string, SSOProvider> = new Map();
  private activeSessions: Map<string, SSOSession> = new Map();
  private mfaConfigurations: Map<string, MFAConfiguration> = new Map();

  private constructor() {
    this.initializeDefaultProviders();
    this.loadSSOData();
    this.startSessionCleanup();
  }

  public static getInstance(): SSOIntegrationService {
    if (!SSOIntegrationService.instance) {
      SSOIntegrationService.instance = new SSOIntegrationService();
    }
    return SSOIntegrationService.instance;
  }

  private initializeDefaultProviders(): void {
    // SAML Provider (Active Directory)
    const adSamlProvider: SSOProvider = {
      id: 'ad-saml',
      name: 'Active Directory SAML',
      type: 'SAML',
      configuration: {
        entityId: 'https://eccohardware.com.au/saml',
        ssoServiceUrl: 'https://adfs.eccohardware.com.au/adfs/ls/',
        x509Certificate: process.env.SAML_X509_CERTIFICATE || 'certificate-content',
        signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
        callbackUrl: 'https://api.saleskik.com/auth/saml/callback',
        logoutUrl: 'https://adfs.eccohardware.com.au/adfs/ls/?wa=wsignout1.0',
        userAttributeMapping: {
          userId: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
          email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
          firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
          lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
          role: 'http://schemas.eccohardware.com.au/identity/claims/role',
          department: 'http://schemas.eccohardware.com.au/identity/claims/department'
        }
      },
      roleMapping: {
        'IT Administrators': 'ADMIN',
        'Procurement Managers': 'MANAGER', 
        'Operations Managers': 'MANAGER',
        'Warehouse Staff': 'WAREHOUSE_STAFF',
        'Accounting Team': 'ACCOUNTING',
        'Employees': 'EMPLOYEE'
      },
      userProvisioning: {
        autoCreateUsers: true,
        autoUpdateUsers: true,
        defaultRole: 'EMPLOYEE',
        requiredAttributes: ['email', 'firstName', 'lastName']
      },
      isActive: true,
      priority: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // OAuth 2.0 Provider (Microsoft Azure AD)
    const azureOAuthProvider: SSOProvider = {
      id: 'azure-oauth',
      name: 'Microsoft Azure AD',
      type: 'OAUTH2',
      configuration: {
        clientId: process.env.AZURE_CLIENT_ID || 'azure-client-id',
        clientSecret: process.env.AZURE_CLIENT_SECRET || 'azure-client-secret',
        authorizationUrl: 'https://login.microsoftonline.com/eccohardware.onmicrosoft.com/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/eccohardware.onmicrosoft.com/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: ['openid', 'profile', 'email', 'User.Read'],
        callbackUrl: 'https://api.saleskik.com/auth/oauth/callback',
        userAttributeMapping: {
          userId: 'id',
          email: 'mail',
          firstName: 'givenName',
          lastName: 'surname',
          role: 'jobTitle',
          department: 'department'
        }
      },
      roleMapping: {
        'IT Manager': 'ADMIN',
        'Procurement Manager': 'MANAGER',
        'Operations Manager': 'MANAGER',
        'Warehouse Supervisor': 'WAREHOUSE_STAFF',
        'Accountant': 'ACCOUNTING',
        'Employee': 'EMPLOYEE'
      },
      userProvisioning: {
        autoCreateUsers: true,
        autoUpdateUsers: true,
        defaultRole: 'EMPLOYEE',
        requiredAttributes: ['email', 'firstName', 'lastName']
      },
      isActive: true,
      priority: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Google OAuth Provider
    const googleOAuthProvider: SSOProvider = {
      id: 'google-oauth',
      name: 'Google Workspace',
      type: 'OAUTH2',
      configuration: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'google-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google-client-secret',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: ['openid', 'email', 'profile'],
        callbackUrl: 'https://api.saleskik.com/auth/google/callback',
        userAttributeMapping: {
          userId: 'id',
          email: 'email',
          firstName: 'given_name',
          lastName: 'family_name',
          role: 'hd', // Hosted domain for role inference
          department: 'locale'
        }
      },
      roleMapping: {
        'admin': 'ADMIN',
        'manager': 'MANAGER',
        'user': 'EMPLOYEE'
      },
      userProvisioning: {
        autoCreateUsers: false, // Require manual approval for Google accounts
        autoUpdateUsers: true,
        defaultRole: 'EMPLOYEE',
        requiredAttributes: ['email']
      },
      isActive: false, // Disabled by default
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.ssoProviders.set('ad-saml', adSamlProvider);
    this.ssoProviders.set('azure-oauth', azureOAuthProvider);
    this.ssoProviders.set('google-oauth', googleOAuthProvider);
  }

  private loadSSOData(): void {
    // Load SSO providers
    const savedProviders = localStorage.getItem('saleskik-sso-providers');
    if (savedProviders) {
      try {
        const providers = JSON.parse(savedProviders);
        providers.forEach((provider: any) => {
          this.ssoProviders.set(provider.id, {
            ...provider,
            createdAt: new Date(provider.createdAt),
            updatedAt: new Date(provider.updatedAt)
          });
        });
      } catch (error) {
        console.error('Error loading SSO providers:', error);
      }
    }

    // Load active sessions
    const savedSessions = localStorage.getItem('saleskik-sso-sessions');
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions);
        sessions.forEach((session: any) => {
          this.activeSessions.set(session.id, {
            ...session,
            tokenExpiresAt: session.tokenExpiresAt ? new Date(session.tokenExpiresAt) : undefined,
            createdAt: new Date(session.createdAt),
            lastActivityAt: new Date(session.lastActivityAt),
            expiresAt: new Date(session.expiresAt)
          });
        });
      } catch (error) {
        console.error('Error loading SSO sessions:', error);
      }
    }
  }

  // SAML Authentication Flow
  public async initiateSAMLLogin(providerId: string): Promise<{
    success: boolean;
    redirectUrl?: string;
    error?: string;
  }> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || provider.type !== 'SAML' || !provider.isActive) {
      return { success: false, error: 'SAML provider not available' };
    }

    try {
      // Generate SAML AuthnRequest
      const samlRequest = this.generateSAMLRequest(provider);
      const redirectUrl = `${provider.configuration.ssoServiceUrl}?SAMLRequest=${encodeURIComponent(samlRequest)}`;
      
      console.log(`SAML login initiated for provider: ${provider.name}`);
      return { success: true, redirectUrl };
    } catch (error) {
      console.error('SAML login initiation failed:', error);
      return { success: false, error: error.message };
    }
  }

  private generateSAMLRequest(provider: SSOProvider): string {
    // In production, use proper SAML library like saml2-js
    const requestId = Date.now().toString();
    const issueInstant = new Date().toISOString();
    
    const samlRequest = `
      <samlp:AuthnRequest 
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="_${requestId}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        Destination="${provider.configuration.ssoServiceUrl}"
        AssertionConsumerServiceURL="${provider.configuration.callbackUrl}">
        <saml:Issuer>${provider.configuration.entityId}</saml:Issuer>
        <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress" AllowCreate="true"/>
      </samlp:AuthnRequest>
    `;

    return btoa(samlRequest); // Base64 encode
  }

  public async processSAMLResponse(samlResponse: string, providerId: string): Promise<{
    success: boolean;
    session?: SSOSession;
    userProvisioning?: UserProvisioningResult;
    error?: string;
  }> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || provider.type !== 'SAML') {
      return { success: false, error: 'Invalid SAML provider' };
    }

    try {
      // Decode and validate SAML response
      const decodedResponse = atob(samlResponse);
      const userAttributes = this.extractSAMLAttributes(decodedResponse, provider);
      
      // Provision user
      const provisioning = await this.provisionUser(userAttributes, provider);
      if (!provisioning.success) {
        return { success: false, error: 'User provisioning failed' };
      }

      // Create SSO session
      const session = await this.createSSOSession(provisioning.userData, provider);
      
      console.log(`SAML authentication successful for user: ${userAttributes.email}`);
      return { success: true, session, userProvisioning: provisioning };
    } catch (error) {
      console.error('SAML response processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  private extractSAMLAttributes(samlResponse: string, provider: SSOProvider): any {
    // In production, use proper XML parsing and validation
    // This is a simplified simulation
    return {
      userId: 'external-user-123',
      email: 'user@eccohardware.com.au',
      firstName: 'John',
      lastName: 'Smith',
      role: 'Procurement Manager',
      department: 'Operations'
    };
  }

  // OAuth 2.0 Authentication Flow
  public async initiateOAuthLogin(providerId: string): Promise<{
    success: boolean;
    authorizationUrl?: string;
    state?: string;
    error?: string;
  }> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || provider.type !== 'OAUTH2' || !provider.isActive) {
      return { success: false, error: 'OAuth provider not available' };
    }

    try {
      const state = this.generateSecureState();
      const authUrl = new URL(provider.configuration.authorizationUrl!);
      
      authUrl.searchParams.set('client_id', provider.configuration.clientId!);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', provider.configuration.scope!.join(' '));
      authUrl.searchParams.set('redirect_uri', provider.configuration.callbackUrl!);
      authUrl.searchParams.set('state', state);
      
      // Store state for validation
      localStorage.setItem(`oauth_state_${state}`, providerId);
      
      console.log(`OAuth login initiated for provider: ${provider.name}`);
      return { success: true, authorizationUrl: authUrl.toString(), state };
    } catch (error) {
      console.error('OAuth login initiation failed:', error);
      return { success: false, error: error.message };
    }
  }

  public async processOAuthCallback(
    code: string, 
    state: string, 
    providerId: string
  ): Promise<{
    success: boolean;
    session?: SSOSession;
    userProvisioning?: UserProvisioningResult;
    error?: string;
  }> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || provider.type !== 'OAUTH2') {
      return { success: false, error: 'Invalid OAuth provider' };
    }

    try {
      // Validate state parameter
      const storedProviderId = localStorage.getItem(`oauth_state_${state}`);
      if (storedProviderId !== providerId) {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange code for access token
      const tokenResponse = await this.exchangeCodeForToken(code, provider);
      if (!tokenResponse.success) {
        return { success: false, error: tokenResponse.error };
      }

      // Get user information
      const userInfo = await this.fetchOAuthUserInfo(tokenResponse.accessToken!, provider);
      
      // Provision user
      const provisioning = await this.provisionUser(userInfo, provider);
      if (!provisioning.success) {
        return { success: false, error: 'User provisioning failed' };
      }

      // Create SSO session
      const session = await this.createSSOSession(provisioning.userData, provider, {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        tokenExpiresAt: tokenResponse.expiresAt
      });

      // Cleanup state
      localStorage.removeItem(`oauth_state_${state}`);
      
      console.log(`OAuth authentication successful for user: ${userInfo.email}`);
      return { success: true, session, userProvisioning: provisioning };
    } catch (error) {
      console.error('OAuth callback processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async exchangeCodeForToken(code: string, provider: SSOProvider): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const response = await fetch(provider.configuration.tokenUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: provider.configuration.clientId!,
          client_secret: provider.configuration.clientSecret!,
          code,
          redirect_uri: provider.configuration.callbackUrl!
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();
      
      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000))
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      return { success: false, error: error.message };
    }
  }

  private async fetchOAuthUserInfo(accessToken: string, provider: SSOProvider): Promise<any> {
    const response = await fetch(provider.configuration.userInfoUrl!, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`User info fetch failed: ${response.status}`);
    }

    const userInfo = await response.json();
    
    // Map attributes according to provider configuration
    const mapping = provider.configuration.userAttributeMapping!;
    
    return {
      userId: userInfo[mapping.userId],
      email: userInfo[mapping.email],
      firstName: userInfo[mapping.firstName],
      lastName: userInfo[mapping.lastName],
      role: userInfo[mapping.role],
      department: userInfo[mapping.department]
    };
  }

  // User provisioning
  private async provisionUser(userAttributes: any, provider: SSOProvider): Promise<UserProvisioningResult> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(userAttributes.email);
      
      if (existingUser) {
        // Update existing user if auto-update enabled
        if (provider.userProvisioning.autoUpdateUsers) {
          const updatedUser = await this.updateUser(existingUser.id, userAttributes, provider);
          return {
            success: true,
            userId: existingUser.id,
            action: 'UPDATED',
            warnings: [],
            errors: [],
            userData: updatedUser
          };
        } else {
          return {
            success: true,
            userId: existingUser.id,
            action: 'FOUND',
            warnings: [],
            errors: [],
            userData: existingUser
          };
        }
      } else {
        // Create new user if auto-create enabled
        if (provider.userProvisioning.autoCreateUsers) {
          const newUser = await this.createUser(userAttributes, provider);
          return {
            success: true,
            userId: newUser.id,
            action: 'CREATED',
            warnings: [],
            errors: [],
            userData: newUser
          };
        } else {
          return {
            success: false,
            action: 'BLOCKED',
            warnings: ['User auto-creation disabled'],
            errors: ['Manual user creation required'],
            userData: null as any
          };
        }
      }
    } catch (error) {
      console.error('User provisioning error:', error);
      return {
        success: false,
        action: 'BLOCKED',
        warnings: [],
        errors: [error.message],
        userData: null as any
      };
    }
  }

  private async createUser(userAttributes: any, provider: SSOProvider): Promise<any> {
    const mappedRole = this.mapExternalRole(userAttributes.role, provider);
    
    const newUser = {
      id: Date.now().toString(),
      email: userAttributes.email,
      firstName: userAttributes.firstName,
      lastName: userAttributes.lastName,
      role: mappedRole,
      department: userAttributes.department,
      isActive: true,
      ssoProvider: provider.id,
      externalUserId: userAttributes.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save user (in production, save to database)
    const users = JSON.parse(localStorage.getItem('saleskik-sso-users') || '[]');
    users.push(newUser);
    localStorage.setItem('saleskik-sso-users', JSON.stringify(users));

    console.log(`SSO user created: ${newUser.email} with role ${mappedRole}`);
    return newUser;
  }

  private async updateUser(userId: string, userAttributes: any, provider: SSOProvider): Promise<any> {
    const users = JSON.parse(localStorage.getItem('saleskik-sso-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex !== -1) {
      const mappedRole = this.mapExternalRole(userAttributes.role, provider);
      
      users[userIndex] = {
        ...users[userIndex],
        firstName: userAttributes.firstName,
        lastName: userAttributes.lastName,
        role: mappedRole,
        department: userAttributes.department,
        updatedAt: new Date()
      };

      localStorage.setItem('saleskik-sso-users', JSON.stringify(users));
      return users[userIndex];
    }

    throw new Error('User not found for update');
  }

  private async findUserByEmail(email: string): Promise<any> {
    const users = JSON.parse(localStorage.getItem('saleskik-sso-users') || '[]');
    return users.find((user: any) => user.email.toLowerCase() === email.toLowerCase());
  }

  private mapExternalRole(externalRole: string, provider: SSOProvider): string {
    return provider.roleMapping[externalRole] || provider.userProvisioning.defaultRole;
  }

  // Session management
  private async createSSOSession(
    userData: any, 
    provider: SSOProvider, 
    tokenData?: {
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: Date;
    }
  ): Promise<SSOSession> {
    const session: SSOSession = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: userData.id,
      providerId: provider.id,
      providerType: provider.type,
      externalUserId: userData.externalUserId,
      sessionToken: this.generateSessionToken(),
      accessToken: tokenData?.accessToken,
      refreshToken: tokenData?.refreshToken,
      tokenExpiresAt: tokenData?.tokenExpiresAt,
      userAttributes: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        department: userData.department
      },
      mfaVerified: false, // Will be updated after MFA
      ipAddress: this.getCurrentIPAddress(),
      userAgent: navigator.userAgent,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    };

    this.activeSessions.set(session.id, session);
    this.saveSSOSessions();

    // Log authentication event
    const auditService = (await import('./AuditTrailService')).default.getInstance();
    auditService.logUserAuthentication({
      eventType: 'LOGIN_SUCCESS',
      userId: userData.id,
      ssoProvider: provider.name
    });

    return session;
  }

  public async validateSession(sessionToken: string): Promise<{
    valid: boolean;
    session?: SSOSession;
    requiresMFA?: boolean;
    error?: string;
  }> {
    const session = Array.from(this.activeSessions.values())
      .find(s => s.sessionToken === sessionToken);

    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      this.activeSessions.delete(session.id);
      this.saveSSOSessions();
      return { valid: false, error: 'Session expired' };
    }

    // Check if MFA is required
    const mfaConfig = this.mfaConfigurations.get(session.userId);
    if (mfaConfig && mfaConfig.enabled && !session.mfaVerified) {
      return { valid: false, requiresMFA: true, session };
    }

    // Update last activity
    session.lastActivityAt = new Date();
    this.activeSessions.set(session.id, session);

    return { valid: true, session };
  }

  // Multi-Factor Authentication
  public async setupMFA(userId: string, method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<{
    success: boolean;
    setupData?: any;
    error?: string;
  }> {
    try {
      const mfaConfig: MFAConfiguration = {
        enabled: true,
        methods: [{
          type: method,
          isRequired: true,
          configuration: await this.generateMFAConfiguration(method, userId)
        }],
        backupCodes: this.generateBackupCodes(),
        lastMFAAt: new Date()
      };

      this.mfaConfigurations.set(userId, mfaConfig);
      this.saveMFAConfigurations();

      const setupData = this.getMFASetupData(method, mfaConfig);
      
      console.log(`MFA setup completed for user ${userId}: ${method}`);
      return { success: true, setupData };
    } catch (error) {
      console.error('MFA setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  public async verifyMFA(sessionId: string, code: string, method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<{
    success: boolean;
    error?: string;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const mfaConfig = this.mfaConfigurations.get(session.userId);
    if (!mfaConfig) {
      return { success: false, error: 'MFA not configured' };
    }

    try {
      const isValid = await this.validateMFACode(code, method, mfaConfig);
      
      if (isValid) {
        session.mfaVerified = true;
        session.lastActivityAt = new Date();
        this.activeSessions.set(sessionId, session);
        this.saveSSOSessions();

        mfaConfig.lastMFAAt = new Date();
        this.mfaConfigurations.set(session.userId, mfaConfig);
        this.saveMFAConfigurations();

        console.log(`MFA verification successful for session: ${sessionId}`);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid MFA code' };
      }
    } catch (error) {
      console.error('MFA verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async generateMFAConfiguration(method: string, userId: string): Promise<any> {
    switch (method) {
      case 'TOTP':
        return {
          issuer: 'SalesKik Purchase Orders',
          totpSecret: this.generateTOTPSecret()
        };
      case 'SMS':
        return {
          smsProvider: 'twilio',
          phoneNumber: await this.getUserPhoneNumber(userId)
        };
      case 'EMAIL':
        return {
          emailAddress: await this.getUserEmail(userId)
        };
      default:
        throw new Error(`Unsupported MFA method: ${method}`);
    }
  }

  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  private getMFASetupData(method: string, config: MFAConfiguration): any {
    const methodConfig = config.methods.find(m => m.type === method);
    
    switch (method) {
      case 'TOTP':
        return {
          qrCodeUrl: `otpauth://totp/SalesKik:${methodConfig?.configuration.emailAddress}?secret=${methodConfig?.configuration.totpSecret}&issuer=SalesKik`,
          secret: methodConfig?.configuration.totpSecret,
          backupCodes: config.backupCodes
        };
      case 'SMS':
        return {
          phoneNumber: methodConfig?.configuration.phoneNumber,
          backupCodes: config.backupCodes
        };
      case 'EMAIL':
        return {
          emailAddress: methodConfig?.configuration.emailAddress,
          backupCodes: config.backupCodes
        };
      default:
        return {};
    }
  }

  private async validateMFACode(code: string, method: string, config: MFAConfiguration): Promise<boolean> {
    // Check backup codes first
    if (config.backupCodes.includes(code.toUpperCase())) {
      // Remove used backup code
      config.backupCodes = config.backupCodes.filter(c => c !== code.toUpperCase());
      return true;
    }

    const methodConfig = config.methods.find(m => m.type === method);
    if (!methodConfig) return false;

    switch (method) {
      case 'TOTP':
        return this.validateTOTPCode(code, methodConfig.configuration.totpSecret!);
      case 'SMS':
      case 'EMAIL':
        // In production, validate against sent code
        return code === '123456'; // Simplified validation
      default:
        return false;
    }
  }

  private validateTOTPCode(code: string, secret: string): boolean {
    // In production, use proper TOTP library like speakeasy
    // Simplified validation for demo
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  // Utility methods
  private generateSecureState(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateSessionToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(64)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getCurrentIPAddress(): string {
    return '192.168.1.100'; // In production, get real client IP
  }

  private async getUserPhoneNumber(userId: string): Promise<string> {
    // Get from user profile
    return '+61400000000'; // Mock phone number
  }

  private async getUserEmail(userId: string): Promise<string> {
    // Get from user profile
    return 'user@eccohardware.com.au'; // Mock email
  }

  // Session cleanup
  private startSessionCleanup(): void {
    // Clean up expired sessions every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.activeSessions) {
      if (now > session.expiresAt) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveSSOSessions();
      console.log(`Cleaned up ${cleaned} expired SSO sessions`);
    }
  }

  // Storage methods
  private saveSSOSessions(): void {
    const sessions = Array.from(this.activeSessions.values());
    localStorage.setItem('saleskik-sso-sessions', JSON.stringify(sessions));
  }

  private saveMFAConfigurations(): void {
    const configs = Array.from(this.mfaConfigurations.entries());
    localStorage.setItem('saleskik-mfa-configurations', JSON.stringify(configs));
  }

  // Public API methods
  public getActiveProviders(): SSOProvider[] {
    return Array.from(this.ssoProviders.values())
      .filter(provider => provider.isActive)
      .sort((a, b) => b.priority - a.priority);
  }

  public getSSOStatistics(): {
    totalProviders: number;
    activeProviders: number;
    activeSessions: number;
    mfaEnabledUsers: number;
    authenticationsByProvider: { [providerId: string]: number };
    averageSessionDuration: number;
  } {
    const activeProviders = Array.from(this.ssoProviders.values()).filter(p => p.isActive);
    const activeSessions = Array.from(this.activeSessions.values()).filter(s => new Date() < s.expiresAt);
    
    return {
      totalProviders: this.ssoProviders.size,
      activeProviders: activeProviders.length,
      activeSessions: activeSessions.length,
      mfaEnabledUsers: this.mfaConfigurations.size,
      authenticationsByProvider: {}, // Would be calculated from audit logs
      averageSessionDuration: 4.5 // Hours (mock data)
    };
  }

  public async logout(sessionToken: string): Promise<boolean> {
    const session = Array.from(this.activeSessions.values())
      .find(s => s.sessionToken === sessionToken);

    if (session) {
      this.activeSessions.delete(session.id);
      this.saveSSOSessions();

      // Log logout event
      const auditService = (await import('./AuditTrailService')).default.getInstance();
      auditService.logUserAuthentication({
        eventType: 'LOGOUT',
        userId: session.userId
      });

      return true;
    }

    return false;
  }
}

export default SSOIntegrationService;