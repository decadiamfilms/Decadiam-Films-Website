// Complete Audit Trail Service for Purchase Orders
// Comprehensive logging for all activities, document access, authentication, and compliance

export interface AuditEvent {
  id: string;
  eventType: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD' | 'APPROVE' | 'REJECT' | 
             'SEND' | 'CONFIRM' | 'RECEIVE' | 'INVOICE' | 'COMPLETE' | 'CANCEL' | 
             'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'SECURITY_EVENT';
  category: 'PURCHASE_ORDER' | 'SUPPLIER' | 'AUTHENTICATION' | 'DOCUMENT' | 'SYSTEM' | 'SECURITY';
  entityType: 'PURCHASE_ORDER' | 'SUPPLIER' | 'ATTACHMENT' | 'USER_SESSION' | 'SYSTEM_CONFIG';
  entityId: string;
  entityName?: string;
  userId: string;
  userName: string;
  userRole: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  description: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    [key: string]: any;
  };
  complianceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  retentionPeriod: number; // Days to retain
  tags?: string[];
}

export interface SecurityEvent extends Omit<AuditEvent, 'eventType' | 'category'> {
  securityEventType: 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'LOGIN_FAILURE' | 
                    'PERMISSION_ESCALATION' | 'DATA_BREACH' | 'MALWARE_DETECTED' | 
                    'SESSION_HIJACK' | 'BRUTE_FORCE' | 'PRIVILEGE_ABUSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatLevel: number; // 1-10 scale
  automaticResponse?: {
    action: 'NONE' | 'ALERT' | 'BLOCK_USER' | 'LOCK_ACCOUNT' | 'SYSTEM_LOCKDOWN';
    performedAt: Date;
    details: string;
  };
  investigation?: {
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
    assignedTo?: string;
    findings?: string;
    resolution?: string;
    closedAt?: Date;
  };
}

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  documentName: string;
  documentType: 'PURCHASE_ORDER' | 'ATTACHMENT' | 'INVOICE' | 'RECEIPT';
  accessType: 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'DELETE' | 'SHARE';
  userId: string;
  userName: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  duration?: number; // How long document was viewed (seconds)
  downloadSize?: number;
  shareRecipients?: string[];
  securityClearance: boolean;
  complianceFlags?: string[];
}

export interface ComplianceReport {
  id: string;
  reportType: 'FINANCIAL_AUDIT' | 'SECURITY_AUDIT' | 'ACCESS_AUDIT' | 'COMPLIANCE_REVIEW';
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  statistics: {
    totalEvents: number;
    eventsByCategory: { [category: string]: number };
    eventsByUser: { [userId: string]: number };
    securityEvents: number;
    complianceViolations: number;
    documentAccesses: number;
    systemChanges: number;
  };
  findings: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    description: string;
    recommendation: string;
    evidence: string[];
  }>;
  recommendations: string[];
  compliance: {
    score: number; // 0-100
    status: 'COMPLIANT' | 'MINOR_ISSUES' | 'MAJOR_ISSUES' | 'NON_COMPLIANT';
    requirements: Array<{
      requirement: string;
      status: 'MET' | 'PARTIAL' | 'NOT_MET';
      evidence?: string;
    }>;
  };
}

class AuditTrailService {
  private static instance: AuditTrailService;
  private auditEvents: AuditEvent[] = [];
  private securityEvents: SecurityEvent[] = [];
  private documentAccessLogs: DocumentAccessLog[] = [];
  private complianceReports: ComplianceReport[] = [];
  private currentSessionId: string = '';
  private retentionPolicies: Map<string, number> = new Map();

  private constructor() {
    this.initializeRetentionPolicies();
    this.loadAuditData();
    this.generateSessionId();
    this.startAuditCleanup();
  }

  public static getInstance(): AuditTrailService {
    if (!AuditTrailService.instance) {
      AuditTrailService.instance = new AuditTrailService();
    }
    return AuditTrailService.instance;
  }

  private initializeRetentionPolicies(): void {
    // Set retention periods based on compliance requirements
    this.retentionPolicies.set('FINANCIAL_AUDIT', 2555); // 7 years for financial records
    this.retentionPolicies.set('SECURITY_EVENT', 1095); // 3 years for security events
    this.retentionPolicies.set('DOCUMENT_ACCESS', 365); // 1 year for document access
    this.retentionPolicies.set('USER_ACTIVITY', 180); // 6 months for user activity
    this.retentionPolicies.set('SYSTEM_EVENT', 90); // 3 months for system events
  }

  private loadAuditData(): void {
    // Load audit events
    const savedEvents = localStorage.getItem('saleskik-audit-events');
    if (savedEvents) {
      try {
        this.auditEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      } catch (error) {
        console.error('Error loading audit events:', error);
      }
    }

    // Load security events
    const savedSecurityEvents = localStorage.getItem('saleskik-security-events');
    if (savedSecurityEvents) {
      try {
        this.securityEvents = JSON.parse(savedSecurityEvents).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
          automaticResponse: event.automaticResponse ? {
            ...event.automaticResponse,
            performedAt: new Date(event.automaticResponse.performedAt)
          } : undefined
        }));
      } catch (error) {
        console.error('Error loading security events:', error);
      }
    }

    // Load document access logs
    const savedDocumentLogs = localStorage.getItem('saleskik-document-access-logs');
    if (savedDocumentLogs) {
      try {
        this.documentAccessLogs = JSON.parse(savedDocumentLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      } catch (error) {
        console.error('Error loading document access logs:', error);
      }
    }
  }

  private generateSessionId(): void {
    this.currentSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Log session start
    this.logAuditEvent({
      eventType: 'LOGIN',
      category: 'AUTHENTICATION',
      entityType: 'USER_SESSION',
      entityId: this.currentSessionId,
      description: 'User session started',
      complianceLevel: 'MEDIUM'
    });
  }

  // Core audit logging method
  public logAuditEvent(eventData: {
    eventType: AuditEvent['eventType'];
    category: AuditEvent['category'];
    entityType: AuditEvent['entityType'];
    entityId: string;
    entityName?: string;
    description: string;
    changes?: Array<{ field: string; oldValue: any; newValue: any }>;
    metadata?: { [key: string]: any };
    complianceLevel?: AuditEvent['complianceLevel'];
    tags?: string[];
  }): string {
    const auditEvent: AuditEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      userRole: this.getCurrentUserRole(),
      sessionId: this.currentSessionId,
      ipAddress: this.getCurrentIPAddress(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      retentionPeriod: this.getRetentionPeriod(eventData.category),
      ...eventData,
      complianceLevel: eventData.complianceLevel || 'MEDIUM'
    };

    this.auditEvents.push(auditEvent);
    this.saveAuditEvents();

    // Check for security implications
    this.analyzeForSecurityThreats(auditEvent);

    console.log(`Audit event logged: ${eventData.eventType} for ${eventData.entityType} ${eventData.entityId}`);
    return auditEvent.id;
  }

  // Purchase order specific audit methods
  public logPurchaseOrderCreated(purchaseOrder: any): void {
    this.logAuditEvent({
      eventType: 'CREATE',
      category: 'PURCHASE_ORDER',
      entityType: 'PURCHASE_ORDER',
      entityId: purchaseOrder.id,
      entityName: purchaseOrder.purchaseOrderNumber,
      description: `Purchase order created for ${purchaseOrder.supplier.supplierName}`,
      metadata: {
        supplierName: purchaseOrder.supplier.supplierName,
        totalAmount: purchaseOrder.totalAmount,
        priority: purchaseOrder.priorityLevel,
        lineItemCount: purchaseOrder.lineItems.length
      },
      complianceLevel: 'HIGH',
      tags: ['purchase-order', 'creation', 'procurement']
    });
  }

  public logPurchaseOrderUpdated(purchaseOrder: any, changes: any[]): void {
    this.logAuditEvent({
      eventType: 'UPDATE',
      category: 'PURCHASE_ORDER',
      entityType: 'PURCHASE_ORDER',
      entityId: purchaseOrder.id,
      entityName: purchaseOrder.purchaseOrderNumber,
      description: `Purchase order updated: ${changes.map(c => c.field).join(', ')}`,
      changes,
      complianceLevel: 'HIGH',
      tags: ['purchase-order', 'modification']
    });
  }

  public logPurchaseOrderApproval(purchaseOrder: any, approved: boolean, comments: string): void {
    this.logAuditEvent({
      eventType: approved ? 'APPROVE' : 'REJECT',
      category: 'PURCHASE_ORDER',
      entityType: 'PURCHASE_ORDER',
      entityId: purchaseOrder.id,
      entityName: purchaseOrder.purchaseOrderNumber,
      description: `Purchase order ${approved ? 'approved' : 'rejected'}`,
      metadata: {
        approvalComments: comments,
        totalAmount: purchaseOrder.totalAmount,
        supplierName: purchaseOrder.supplier.supplierName
      },
      complianceLevel: 'CRITICAL',
      tags: ['purchase-order', 'approval', 'authorization']
    });
  }

  public logSupplierConfirmation(purchaseOrder: any, confirmationData: any): void {
    this.logAuditEvent({
      eventType: 'CONFIRM',
      category: 'PURCHASE_ORDER',
      entityType: 'PURCHASE_ORDER',
      entityId: purchaseOrder.id,
      entityName: purchaseOrder.purchaseOrderNumber,
      description: 'Supplier confirmed purchase order',
      metadata: {
        supplierName: purchaseOrder.supplier.supplierName,
        confirmedDeliveryDate: confirmationData.deliveryDate,
        supplierComments: confirmationData.supplierComments,
        confirmationToken: confirmationData.confirmationToken
      },
      complianceLevel: 'HIGH',
      tags: ['supplier', 'confirmation', 'delivery']
    });
  }

  public logGoodsReceipt(purchaseOrder: any, receiptData: any): void {
    this.logAuditEvent({
      eventType: 'RECEIVE',
      category: 'PURCHASE_ORDER',
      entityType: 'PURCHASE_ORDER',
      entityId: purchaseOrder.id,
      entityName: purchaseOrder.purchaseOrderNumber,
      description: `Goods received: ${receiptData.isCompleteReceipt ? 'complete' : 'partial'}`,
      metadata: {
        receivedBy: receiptData.receivedBy,
        deliveryCondition: receiptData.deliveryCondition,
        receiptDate: receiptData.receiptDate,
        itemsReceived: receiptData.lineItemReceipts.length,
        discrepancies: receiptData.lineItemReceipts.filter((item: any) => item.hasDiscrepancy).length
      },
      complianceLevel: 'CRITICAL',
      tags: ['goods-receipt', 'inventory', 'delivery']
    });
  }

  public logInvoiceCreated(purchaseOrder: any, invoiceData: any): void {
    this.logAuditEvent({
      eventType: 'INVOICE',
      category: 'PURCHASE_ORDER',
      entityType: 'PURCHASE_ORDER',
      entityId: purchaseOrder.id,
      entityName: purchaseOrder.purchaseOrderNumber,
      description: 'Invoice created and dispatch unblocked',
      metadata: {
        invoiceNumber: invoiceData.invoiceNumber,
        matchingAccuracy: invoiceData.matchingAccuracy,
        totalAmount: purchaseOrder.totalAmount,
        dispatchUnblocked: true
      },
      complianceLevel: 'CRITICAL',
      tags: ['invoice', 'financial', 'dispatch-clearance']
    });
  }

  // Document access logging
  public logDocumentAccess(documentData: {
    documentId: string;
    documentName: string;
    documentType: DocumentAccessLog['documentType'];
    accessType: DocumentAccessLog['accessType'];
    duration?: number;
    downloadSize?: number;
    shareRecipients?: string[];
  }): string {
    const accessLog: DocumentAccessLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      sessionId: this.currentSessionId,
      ipAddress: this.getCurrentIPAddress(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      securityClearance: this.verifySecurityClearance(documentData.documentType),
      complianceFlags: this.checkComplianceFlags(documentData),
      ...documentData
    };

    this.documentAccessLogs.push(accessLog);
    this.saveDocumentAccessLogs();

    // Also create audit event
    this.logAuditEvent({
      eventType: documentData.accessType as any,
      category: 'DOCUMENT',
      entityType: 'ATTACHMENT',
      entityId: documentData.documentId,
      entityName: documentData.documentName,
      description: `Document ${documentData.accessType.toLowerCase()}: ${documentData.documentName}`,
      metadata: {
        documentType: documentData.documentType,
        fileSize: documentData.downloadSize,
        duration: documentData.duration
      },
      complianceLevel: this.getDocumentComplianceLevel(documentData.documentType),
      tags: ['document-access', documentData.documentType.toLowerCase()]
    });

    return accessLog.id;
  }

  // Authentication and session logging
  public logUserAuthentication(authData: {
    eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'SESSION_EXPIRED';
    userId?: string;
    attemptedEmail?: string;
    failureReason?: string;
    mfaUsed?: boolean;
    ssoProvider?: string;
  }): void {
    const isSecurityEvent = authData.eventType === 'LOGIN_FAILURE';

    if (isSecurityEvent) {
      this.logSecurityEvent({
        securityEventType: 'LOGIN_FAILURE',
        severity: 'MEDIUM',
        threatLevel: 3,
        entityType: 'USER_SESSION',
        entityId: authData.attemptedEmail || 'unknown',
        description: `Failed login attempt: ${authData.failureReason}`,
        metadata: {
          attemptedEmail: authData.attemptedEmail,
          failureReason: authData.failureReason,
          consecutiveFailures: this.getConsecutiveFailures(authData.attemptedEmail)
        },
        complianceLevel: 'HIGH'
      });
    } else {
      this.logAuditEvent({
        eventType: authData.eventType === 'LOGIN_SUCCESS' ? 'LOGIN' : 'LOGOUT',
        category: 'AUTHENTICATION',
        entityType: 'USER_SESSION',
        entityId: authData.userId || this.currentSessionId,
        description: `User ${authData.eventType.toLowerCase().replace('_', ' ')}`,
        metadata: {
          mfaUsed: authData.mfaUsed,
          ssoProvider: authData.ssoProvider,
          sessionDuration: authData.eventType === 'LOGOUT' ? this.getSessionDuration() : undefined
        },
        complianceLevel: 'HIGH',
        tags: ['authentication', 'security']
      });
    }
  }

  // Security event logging
  public logSecurityEvent(securityData: {
    securityEventType: SecurityEvent['securityEventType'];
    severity: SecurityEvent['severity'];
    threatLevel: number;
    entityType: SecurityEvent['entityType'];
    entityId: string;
    entityName?: string;
    description: string;
    metadata?: { [key: string]: any };
    complianceLevel?: SecurityEvent['complianceLevel'];
  }): string {
    const securityEvent: SecurityEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      userRole: this.getCurrentUserRole(),
      sessionId: this.currentSessionId,
      ipAddress: this.getCurrentIPAddress(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      retentionPeriod: this.retentionPolicies.get('SECURITY_EVENT') || 1095,
      complianceLevel: securityData.complianceLevel || 'HIGH',
      investigation: {
        status: 'OPEN',
        assignedTo: 'security-team'
      },
      ...securityData
    };

    // Determine automatic response
    if (securityEvent.severity === 'CRITICAL' || securityEvent.threatLevel >= 8) {
      securityEvent.automaticResponse = {
        action: 'ALERT',
        performedAt: new Date(),
        details: 'Security team notified automatically'
      };

      this.triggerSecurityAlert(securityEvent);
    }

    this.securityEvents.push(securityEvent);
    this.saveSecurityEvents();

    console.warn(`Security event logged: ${securityData.securityEventType} (Severity: ${securityData.severity})`);
    return securityEvent.id;
  }

  // Audit analysis and threat detection
  private analyzeForSecurityThreats(auditEvent: AuditEvent): void {
    // Check for suspicious patterns
    const recentEvents = this.auditEvents.filter(event => 
      event.userId === auditEvent.userId &&
      (Date.now() - event.timestamp.getTime()) < 60 * 60 * 1000 // Last hour
    );

    // Detect rapid successive actions (possible automation/bot)
    if (recentEvents.length > 50) {
      this.logSecurityEvent({
        securityEventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        threatLevel: 5,
        entityType: auditEvent.entityType,
        entityId: auditEvent.entityId,
        description: `Unusual activity pattern: ${recentEvents.length} actions in 1 hour`,
        metadata: { recentEventCount: recentEvents.length },
        complianceLevel: 'HIGH'
      });
    }

    // Detect privilege escalation attempts
    if (auditEvent.eventType === 'ACCESS_DENIED') {
      const deniedAttempts = recentEvents.filter(event => event.eventType === 'ACCESS_DENIED').length;
      
      if (deniedAttempts >= 5) {
        this.logSecurityEvent({
          securityEventType: 'PERMISSION_ESCALATION',
          severity: 'HIGH',
          threatLevel: 7,
          entityType: auditEvent.entityType,
          entityId: auditEvent.entityId,
          description: `Multiple access denied attempts: ${deniedAttempts} in 1 hour`,
          metadata: { deniedAttempts },
          complianceLevel: 'CRITICAL'
        });
      }
    }
  }

  private getConsecutiveFailures(email?: string): number {
    if (!email) return 0;
    
    const recentFailures = this.securityEvents.filter(event => 
      event.securityEventType === 'LOGIN_FAILURE' &&
      event.metadata?.attemptedEmail === email &&
      (Date.now() - event.timestamp.getTime()) < 60 * 60 * 1000 // Last hour
    );

    return recentFailures.length;
  }

  private triggerSecurityAlert(securityEvent: SecurityEvent): void {
    // In production, this would alert security team
    console.error('SECURITY ALERT:', {
      type: securityEvent.securityEventType,
      severity: securityEvent.severity,
      description: securityEvent.description,
      user: securityEvent.userName,
      timestamp: securityEvent.timestamp
    });

    // Send to security monitoring system
    this.sendToSecurityMonitoring(securityEvent);
  }

  private sendToSecurityMonitoring(securityEvent: SecurityEvent): void {
    // Integration with SIEM or security monitoring system
    const securityAlert = {
      alert_id: securityEvent.id,
      alert_type: securityEvent.securityEventType,
      severity: securityEvent.severity,
      threat_level: securityEvent.threatLevel,
      user_id: securityEvent.userId,
      ip_address: securityEvent.ipAddress,
      timestamp: securityEvent.timestamp.toISOString(),
      description: securityEvent.description,
      metadata: securityEvent.metadata
    };

    // In production, send to security monitoring API
    console.log('Security alert sent to monitoring system:', securityAlert);
  }

  // Compliance reporting
  public generateComplianceReport(
    reportType: ComplianceReport['reportType'],
    period: { startDate: Date; endDate: Date }
  ): ComplianceReport {
    const filteredEvents = this.auditEvents.filter(event => 
      event.timestamp >= period.startDate && event.timestamp <= period.endDate
    );

    const filteredSecurityEvents = this.securityEvents.filter(event =>
      event.timestamp >= period.startDate && event.timestamp <= period.endDate
    );

    const filteredDocumentAccess = this.documentAccessLogs.filter(log =>
      log.timestamp >= period.startDate && log.timestamp <= period.endDate
    );

    // Compile statistics
    const statistics = {
      totalEvents: filteredEvents.length,
      eventsByCategory: this.groupByCategory(filteredEvents),
      eventsByUser: this.groupByUser(filteredEvents),
      securityEvents: filteredSecurityEvents.length,
      complianceViolations: this.countComplianceViolations(filteredEvents),
      documentAccesses: filteredDocumentAccess.length,
      systemChanges: filteredEvents.filter(event => event.category === 'SYSTEM').length
    };

    // Generate findings
    const findings = this.analyzeComplianceFindings(filteredEvents, filteredSecurityEvents);
    
    // Calculate compliance score
    const compliance = this.calculateComplianceScore(statistics, findings);

    const report: ComplianceReport = {
      id: Date.now().toString(),
      reportType,
      generatedAt: new Date(),
      period,
      statistics,
      findings,
      recommendations: this.generateComplianceRecommendations(findings),
      compliance
    };

    this.complianceReports.push(report);
    this.saveComplianceReports();

    return report;
  }

  private groupByCategory(events: AuditEvent[]): { [category: string]: number } {
    return events.reduce((acc: any, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByUser(events: AuditEvent[]): { [userId: string]: number } {
    return events.reduce((acc: any, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {});
  }

  private countComplianceViolations(events: AuditEvent[]): number {
    return events.filter(event => 
      event.complianceLevel === 'CRITICAL' || 
      event.tags?.includes('violation')
    ).length;
  }

  private analyzeComplianceFindings(events: AuditEvent[], securityEvents: SecurityEvent[]): any[] {
    const findings = [];

    // Check for critical security events
    const criticalSecurityEvents = securityEvents.filter(event => event.severity === 'CRITICAL');
    if (criticalSecurityEvents.length > 0) {
      findings.push({
        severity: 'CRITICAL',
        category: 'SECURITY',
        description: `${criticalSecurityEvents.length} critical security events detected`,
        recommendation: 'Immediate security review and incident response required',
        evidence: criticalSecurityEvents.map(event => event.description)
      });
    }

    // Check for excessive failed logins
    const loginFailures = securityEvents.filter(event => 
      event.securityEventType === 'LOGIN_FAILURE'
    );
    if (loginFailures.length > 10) {
      findings.push({
        severity: 'HIGH',
        category: 'AUTHENTICATION',
        description: `High number of login failures: ${loginFailures.length}`,
        recommendation: 'Review authentication security and consider implementing additional controls',
        evidence: [`${loginFailures.length} failed login attempts`]
      });
    }

    // Check for unauthorized access attempts
    const accessDenied = events.filter(event => event.eventType === 'ACCESS_DENIED');
    if (accessDenied.length > 20) {
      findings.push({
        severity: 'MEDIUM',
        category: 'ACCESS_CONTROL',
        description: `Multiple unauthorized access attempts: ${accessDenied.length}`,
        recommendation: 'Review user permissions and access control policies',
        evidence: [`${accessDenied.length} access denied events`]
      });
    }

    return findings;
  }

  private calculateComplianceScore(statistics: any, findings: any[]): any {
    let score = 100;

    // Deduct points for findings
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'CRITICAL': score -= 25; break;
        case 'HIGH': score -= 15; break;
        case 'MEDIUM': score -= 10; break;
        case 'LOW': score -= 5; break;
      }
    });

    // Bonus points for good practices
    if (statistics.totalEvents > 100) score += 5; // Good logging activity
    if (statistics.securityEvents === 0) score += 10; // No security incidents

    score = Math.max(0, Math.min(100, score));

    const status = score >= 90 ? 'COMPLIANT' :
                  score >= 70 ? 'MINOR_ISSUES' :
                  score >= 50 ? 'MAJOR_ISSUES' : 'NON_COMPLIANT';

    return {
      score,
      status,
      requirements: this.checkComplianceRequirements(statistics, findings)
    };
  }

  private checkComplianceRequirements(statistics: any, findings: any[]): any[] {
    return [
      {
        requirement: 'Comprehensive activity logging',
        status: statistics.totalEvents > 50 ? 'MET' : 'NOT_MET',
        evidence: `${statistics.totalEvents} events logged`
      },
      {
        requirement: 'Security event monitoring',
        status: findings.filter(f => f.category === 'SECURITY').length === 0 ? 'MET' : 'NOT_MET',
        evidence: `${findings.filter(f => f.category === 'SECURITY').length} security issues`
      },
      {
        requirement: 'Document access tracking',
        status: statistics.documentAccesses > 0 ? 'MET' : 'NOT_MET',
        evidence: `${statistics.documentAccesses} document access events`
      },
      {
        requirement: 'User authentication logging',
        status: 'MET',
        evidence: 'Authentication events properly logged'
      }
    ];
  }

  private generateComplianceRecommendations(findings: any[]): string[] {
    const recommendations = [];

    if (findings.some(f => f.category === 'SECURITY')) {
      recommendations.push('Implement enhanced security monitoring and alerting');
    }

    if (findings.some(f => f.category === 'ACCESS_CONTROL')) {
      recommendations.push('Review and update user access control policies');
    }

    if (findings.some(f => f.severity === 'CRITICAL')) {
      recommendations.push('Immediate security review and incident response required');
    }

    return recommendations;
  }

  // Helper methods
  private getCurrentUserId(): string {
    return 'current-user'; // In production, get from auth context
  }

  private getCurrentUserName(): string {
    return 'Current User'; // In production, get from auth context
  }

  private getCurrentUserRole(): string {
    return 'ADMIN'; // In production, get from auth context
  }

  private getCurrentIPAddress(): string {
    return '192.168.1.100'; // In production, get real client IP
  }

  private getRetentionPeriod(category: string): number {
    return this.retentionPolicies.get(category) || 365;
  }

  private verifySecurityClearance(documentType: string): boolean {
    // In production, check user's security clearance level
    return true;
  }

  private checkComplianceFlags(documentData: any): string[] {
    const flags = [];
    
    if (documentData.accessType === 'DOWNLOAD' && !documentData.downloadSize) {
      flags.push('INCOMPLETE_DOWNLOAD_LOG');
    }
    
    if (documentData.accessType === 'SHARE' && !documentData.shareRecipients) {
      flags.push('MISSING_SHARE_RECIPIENTS');
    }

    return flags;
  }

  private getDocumentComplianceLevel(documentType: string): AuditEvent['complianceLevel'] {
    switch (documentType) {
      case 'PURCHASE_ORDER': return 'CRITICAL';
      case 'INVOICE': return 'CRITICAL';
      case 'ATTACHMENT': return 'HIGH';
      default: return 'MEDIUM';
    }
  }

  private getSessionDuration(): number {
    // Calculate session duration in minutes
    const sessionStart = this.auditEvents
      .filter(event => event.sessionId === this.currentSessionId && event.eventType === 'LOGIN')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];

    if (sessionStart) {
      return Math.floor((Date.now() - sessionStart.timestamp.getTime()) / (1000 * 60));
    }

    return 0;
  }

  // Cleanup old audit data based on retention policies
  private startAuditCleanup(): void {
    // Run cleanup daily at 2 AM
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);

    const msUntilCleanup = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.cleanupAuditData();
      
      // Then run daily
      setInterval(() => {
        this.cleanupAuditData();
      }, 24 * 60 * 60 * 1000);
    }, msUntilCleanup);
  }

  private cleanupAuditData(): void {
    const now = new Date();
    let cleaned = 0;

    // Cleanup audit events based on retention periods
    this.auditEvents = this.auditEvents.filter(event => {
      const ageInDays = (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays > event.retentionPeriod) {
        cleaned++;
        return false;
      }
      return true;
    });

    // Cleanup document access logs
    const documentRetentionDays = this.retentionPolicies.get('DOCUMENT_ACCESS') || 365;
    this.documentAccessLogs = this.documentAccessLogs.filter(log => {
      const ageInDays = (now.getTime() - log.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return ageInDays <= documentRetentionDays;
    });

    if (cleaned > 0) {
      this.saveAuditEvents();
      this.saveDocumentAccessLogs();
      console.log(`Audit cleanup: ${cleaned} old records removed`);
    }
  }

  // Storage methods
  private saveAuditEvents(): void {
    localStorage.setItem('saleskik-audit-events', JSON.stringify(this.auditEvents));
  }

  private saveSecurityEvents(): void {
    localStorage.setItem('saleskik-security-events', JSON.stringify(this.securityEvents));
  }

  private saveDocumentAccessLogs(): void {
    localStorage.setItem('saleskik-document-access-logs', JSON.stringify(this.documentAccessLogs));
  }

  private saveComplianceReports(): void {
    localStorage.setItem('saleskik-compliance-reports', JSON.stringify(this.complianceReports));
  }

  // Public API methods
  public getAuditTrail(entityId?: string, entityType?: string): AuditEvent[] {
    let filtered = [...this.auditEvents];

    if (entityId) {
      filtered = filtered.filter(event => event.entityId === entityId);
    }

    if (entityType) {
      filtered = filtered.filter(event => event.entityType === entityType);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getSecurityEvents(severity?: SecurityEvent['severity']): SecurityEvent[] {
    let filtered = [...this.securityEvents];

    if (severity) {
      filtered = filtered.filter(event => event.severity === severity);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getDocumentAccessLogs(documentId?: string): DocumentAccessLog[] {
    let filtered = [...this.documentAccessLogs];

    if (documentId) {
      filtered = filtered.filter(log => log.documentId === documentId);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getComplianceReports(): ComplianceReport[] {
    return [...this.complianceReports].sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  public exportAuditTrail(format: 'CSV' | 'JSON' | 'PDF', filters?: any): { success: boolean; downloadUrl?: string; error?: string } {
    try {
      const filteredEvents = this.getAuditTrail(filters?.entityId, filters?.entityType);
      
      let content: string;
      let mimeType: string;
      let filename: string;

      switch (format) {
        case 'CSV':
          content = this.exportToCSV(filteredEvents);
          mimeType = 'text/csv';
          filename = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'JSON':
          content = JSON.stringify(filteredEvents, null, 2);
          mimeType = 'application/json';
          filename = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          return { success: false, error: 'Unsupported export format' };
      }

      const blob = new Blob([content], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      return { success: true, downloadUrl };
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      return { success: false, error: error.message };
    }
  }

  private exportToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID', 'Timestamp', 'Event Type', 'Category', 'Entity Type', 'Entity ID',
      'User ID', 'User Name', 'User Role', 'IP Address', 'Description', 'Compliance Level'
    ];

    const rows = events.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.eventType,
      event.category,
      event.entityType,
      event.entityId,
      event.userId,
      event.userName,
      event.userRole,
      event.ipAddress,
      event.description,
      event.complianceLevel
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}

export default AuditTrailService;