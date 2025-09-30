// Penetration Testing Service for Purchase Order System
// Security vulnerability scanning, SQL injection testing, and security validation

export interface SecurityVulnerability {
  id: string;
  type: 'SQL_INJECTION' | 'XSS' | 'CSRF' | 'AUTH_BYPASS' | 'FILE_UPLOAD' | 'SESSION_HIJACK' | 'PRIVILEGE_ESCALATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  endpoint: string;
  method: string;
  parameter?: string;
  description: string;
  impact: string;
  remediation: string;
  proofOfConcept: string;
  discoveredAt: Date;
  status: 'OPEN' | 'MITIGATED' | 'FIXED' | 'FALSE_POSITIVE';
  cvssScore?: number;
}

export interface PenetrationTestSuite {
  id: string;
  name: string;
  description: string;
  testCases: PenetrationTestCase[];
  targetEndpoints: string[];
  executedAt?: Date;
  duration?: number;
  vulnerabilitiesFound: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  results?: PenetrationTestResults;
}

export interface PenetrationTestCase {
  id: string;
  name: string;
  type: SecurityVulnerability['type'];
  endpoint: string;
  method: string;
  payloads: string[];
  expectedResponse: {
    secure: string[];
    vulnerable: string[];
  };
  automated: boolean;
}

export interface PenetrationTestResults {
  testSuiteId: string;
  executedAt: Date;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  vulnerabilities: SecurityVulnerability[];
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  complianceStatus: {
    owasp: 'COMPLIANT' | 'NON_COMPLIANT';
    iso27001: 'COMPLIANT' | 'NON_COMPLIANT';
    pciDss: 'COMPLIANT' | 'NON_COMPLIANT';
  };
}

class PenetrationTestingService {
  private static instance: PenetrationTestingService;
  private testSuites: Map<string, PenetrationTestSuite> = new Map();
  private vulnerabilities: SecurityVulnerability[] = [];

  private constructor() {
    this.initializeTestSuites();
    this.loadVulnerabilities();
  }

  public static getInstance(): PenetrationTestingService {
    if (!PenetrationTestingService.instance) {
      PenetrationTestingService.instance = new PenetrationTestingService();
    }
    return PenetrationTestingService.instance;
  }

  private initializeTestSuites(): void {
    // SQL Injection Test Suite
    const sqlInjectionSuite: PenetrationTestSuite = {
      id: 'sql-injection-tests',
      name: 'SQL Injection Vulnerability Testing',
      description: 'Comprehensive SQL injection testing for all database input points',
      testCases: [
        {
          id: 'sql-union-select',
          name: 'Union-based SQL Injection',
          type: 'SQL_INJECTION',
          endpoint: '/api/purchase-orders',
          method: 'GET',
          payloads: [
            "' UNION SELECT 1,2,3,4,5--",
            "' UNION SELECT null,null,null,null,null--",
            "1' UNION SELECT @@version--"
          ],
          expectedResponse: {
            secure: ['400 Bad Request', 'Invalid parameter', 'Validation error'],
            vulnerable: ['MySQL', 'PostgreSQL', 'Database error', 'SQL syntax']
          },
          automated: true
        },
        {
          id: 'sql-blind-boolean',
          name: 'Blind Boolean SQL Injection',
          type: 'SQL_INJECTION',
          endpoint: '/api/purchase-orders/{id}',
          method: 'GET',
          payloads: [
            "1' AND 1=1--",
            "1' AND 1=2--",
            "1' AND (SELECT COUNT(*) FROM users)>0--"
          ],
          expectedResponse: {
            secure: ['Same response for both payloads'],
            vulnerable: ['Different responses based on boolean condition']
          },
          automated: true
        }
      ],
      targetEndpoints: [
        '/api/purchase-orders',
        '/api/purchase-orders/{id}',
        '/api/suppliers',
        '/api/search'
      ],
      vulnerabilitiesFound: 0,
      status: 'PENDING'
    };

    // XSS Test Suite
    const xssTestSuite: PenetrationTestSuite = {
      id: 'xss-tests',
      name: 'Cross-Site Scripting (XSS) Testing',
      description: 'Testing for reflected, stored, and DOM-based XSS vulnerabilities',
      testCases: [
        {
          id: 'xss-reflected',
          name: 'Reflected XSS in Search',
          type: 'XSS',
          endpoint: '/api/purchase-orders',
          method: 'GET',
          payloads: [
            '<script>alert("XSS")</script>',
            '"><script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src=x onerror=alert("XSS")>'
          ],
          expectedResponse: {
            secure: ['Escaped HTML', 'Sanitized output'],
            vulnerable: ['<script>', 'javascript:', 'onerror=']
          },
          automated: true
        },
        {
          id: 'xss-stored',
          name: 'Stored XSS in Form Fields',
          type: 'XSS',
          endpoint: '/api/purchase-orders',
          method: 'POST',
          payloads: [
            '<script>alert("Stored XSS")</script>',
            '<iframe src="javascript:alert(\'XSS\')"></iframe>',
            '<svg onload=alert("XSS")>'
          ],
          expectedResponse: {
            secure: ['Input sanitized', 'HTML escaped'],
            vulnerable: ['Script executed', 'Malicious content stored']
          },
          automated: true
        }
      ],
      targetEndpoints: [
        '/api/purchase-orders',
        '/api/suppliers',
        '/api/upload'
      ],
      vulnerabilitiesFound: 0,
      status: 'PENDING'
    };

    // Authentication Test Suite
    const authTestSuite: PenetrationTestSuite = {
      id: 'auth-tests',
      name: 'Authentication and Authorization Testing',
      description: 'Testing authentication bypass and privilege escalation vulnerabilities',
      testCases: [
        {
          id: 'auth-bypass-jwt',
          name: 'JWT Token Manipulation',
          type: 'AUTH_BYPASS',
          endpoint: '/api/purchase-orders',
          method: 'GET',
          payloads: [
            'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.',
            'Bearer invalid-token',
            'Bearer '
          ],
          expectedResponse: {
            secure: ['401 Unauthorized', 'Invalid token'],
            vulnerable: ['200 OK', 'Access granted']
          },
          automated: true
        },
        {
          id: 'privilege-escalation',
          name: 'Privilege Escalation Testing',
          type: 'PRIVILEGE_ESCALATION',
          endpoint: '/api/purchase-orders/{id}/approve',
          method: 'POST',
          payloads: [
            '{"role": "admin"}',
            '{"user_id": "admin-user-id"}',
            '{"permissions": ["admin"]}'
          ],
          expectedResponse: {
            secure: ['403 Forbidden', 'Insufficient permissions'],
            vulnerable: ['200 OK', 'Action performed']
          },
          automated: true
        }
      ],
      targetEndpoints: [
        '/api/auth/login',
        '/api/purchase-orders',
        '/api/purchase-orders/{id}/approve'
      ],
      vulnerabilitiesFound: 0,
      status: 'PENDING'
    };

    this.testSuites.set('sql-injection-tests', sqlInjectionSuite);
    this.testSuites.set('xss-tests', xssTestSuite);
    this.testSuites.set('auth-tests', authTestSuite);
  }

  // Execute penetration test suite
  public async executePenetrationTest(suiteId: string): Promise<PenetrationTestResults> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error('Test suite not found');
    }

    console.log(`Starting penetration test: ${suite.name}`);
    
    suite.status = 'RUNNING';
    suite.executedAt = new Date();
    const startTime = Date.now();

    const vulnerabilities: SecurityVulnerability[] = [];
    let passedTests = 0;
    let failedTests = 0;

    try {
      // Execute each test case
      for (const testCase of suite.testCases) {
        const result = await this.executeTestCase(testCase);
        
        if (result.vulnerable) {
          const vulnerability: SecurityVulnerability = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: testCase.type,
            severity: this.calculateSeverity(testCase.type, result.details),
            endpoint: testCase.endpoint,
            method: testCase.method,
            parameter: result.vulnerableParameter,
            description: result.description,
            impact: result.impact,
            remediation: result.remediation,
            proofOfConcept: result.proofOfConcept,
            discoveredAt: new Date(),
            status: 'OPEN',
            cvssScore: result.cvssScore
          };

          vulnerabilities.push(vulnerability);
          this.vulnerabilities.push(vulnerability);
          failedTests++;
        } else {
          passedTests++;
        }
      }

      const duration = Date.now() - startTime;
      suite.duration = duration;
      suite.status = 'COMPLETED';
      suite.vulnerabilitiesFound = vulnerabilities.length;

      const results: PenetrationTestResults = {
        testSuiteId: suiteId,
        executedAt: suite.executedAt,
        duration,
        totalTests: suite.testCases.length,
        passedTests,
        failedTests,
        vulnerabilities,
        overallRisk: this.calculateOverallRisk(vulnerabilities),
        recommendations: this.generateRecommendations(vulnerabilities),
        complianceStatus: this.assessCompliance(vulnerabilities)
      };

      suite.results = results;
      this.saveTestResults();

      console.log(`Penetration test completed: ${vulnerabilities.length} vulnerabilities found`);
      return results;
    } catch (error) {
      console.error('Penetration test failed:', error);
      suite.status = 'FAILED';
      throw error;
    }
  }

  private async executeTestCase(testCase: PenetrationTestCase): Promise<{
    vulnerable: boolean;
    details: any;
    vulnerableParameter?: string;
    description: string;
    impact: string;
    remediation: string;
    proofOfConcept: string;
    cvssScore?: number;
  }> {
    console.log(`Executing test case: ${testCase.name}`);

    // Simulate test execution (in production, make actual HTTP requests)
    for (const payload of testCase.payloads) {
      const testResult = await this.simulateSecurityTest(testCase, payload);
      
      if (testResult.isVulnerable) {
        return {
          vulnerable: true,
          details: testResult,
          vulnerableParameter: testResult.parameter,
          description: this.getVulnerabilityDescription(testCase.type),
          impact: this.getVulnerabilityImpact(testCase.type),
          remediation: this.getVulnerabilityRemediation(testCase.type),
          proofOfConcept: `${testCase.method} ${testCase.endpoint} with payload: ${payload}`,
          cvssScore: this.calculateCVSSScore(testCase.type)
        };
      }
    }

    return {
      vulnerable: false,
      details: { secure: true },
      description: 'No vulnerabilities found',
      impact: 'None',
      remediation: 'No action required',
      proofOfConcept: 'All payloads properly handled'
    };
  }

  private async simulateSecurityTest(testCase: PenetrationTestCase, payload: string): Promise<{
    isVulnerable: boolean;
    parameter?: string;
    response?: string;
  }> {
    // Simulate security testing (in production, make real HTTP requests)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate vulnerability detection (randomly for demo)
    const isVulnerable = Math.random() < 0.1; // 10% chance of finding vulnerability
    
    return {
      isVulnerable,
      parameter: isVulnerable ? 'search' : undefined,
      response: isVulnerable ? 'Vulnerable response detected' : 'Secure response'
    };
  }

  private calculateSeverity(type: SecurityVulnerability['type'], details: any): SecurityVulnerability['severity'] {
    const severityMap: { [key: string]: SecurityVulnerability['severity'] } = {
      'SQL_INJECTION': 'HIGH',
      'XSS': 'MEDIUM',
      'CSRF': 'MEDIUM',
      'AUTH_BYPASS': 'CRITICAL',
      'FILE_UPLOAD': 'HIGH',
      'SESSION_HIJACK': 'HIGH',
      'PRIVILEGE_ESCALATION': 'CRITICAL'
    };

    return severityMap[type] || 'MEDIUM';
  }

  private getVulnerabilityDescription(type: SecurityVulnerability['type']): string {
    const descriptions = {
      'SQL_INJECTION': 'SQL injection vulnerability allows attackers to execute arbitrary SQL commands',
      'XSS': 'Cross-site scripting vulnerability allows execution of malicious client-side scripts',
      'CSRF': 'Cross-site request forgery vulnerability allows unauthorized actions',
      'AUTH_BYPASS': 'Authentication bypass allows unauthorized access to protected resources',
      'FILE_UPLOAD': 'File upload vulnerability allows upload of malicious files',
      'SESSION_HIJACK': 'Session hijacking vulnerability allows unauthorized session access',
      'PRIVILEGE_ESCALATION': 'Privilege escalation allows users to gain unauthorized elevated permissions'
    };

    return descriptions[type] || 'Security vulnerability detected';
  }

  private getVulnerabilityImpact(type: SecurityVulnerability['type']): string {
    const impacts = {
      'SQL_INJECTION': 'Data breach, data manipulation, system compromise',
      'XSS': 'Session theft, data theft, malicious actions on behalf of users',
      'CSRF': 'Unauthorized actions, data modification, privilege abuse',
      'AUTH_BYPASS': 'Complete system compromise, unauthorized data access',
      'FILE_UPLOAD': 'Server compromise, malware deployment, data theft',
      'SESSION_HIJACK': 'Account takeover, unauthorized access, data theft',
      'PRIVILEGE_ESCALATION': 'Complete system compromise, unauthorized administrative access'
    };

    return impacts[type] || 'Security compromise';
  }

  private getVulnerabilityRemediation(type: SecurityVulnerability['type']): string {
    const remediations = {
      'SQL_INJECTION': 'Use parameterized queries, input validation, and ORM frameworks',
      'XSS': 'Implement proper output encoding, Content Security Policy, and input validation',
      'CSRF': 'Implement CSRF tokens, SameSite cookies, and proper origin validation',
      'AUTH_BYPASS': 'Strengthen authentication mechanisms, implement proper session management',
      'FILE_UPLOAD': 'Implement file type validation, virus scanning, and secure file storage',
      'SESSION_HIJACK': 'Use secure session tokens, HTTPS only, and proper session expiration',
      'PRIVILEGE_ESCALATION': 'Implement proper role-based access control and permission validation'
    };

    return remediations[type] || 'Implement appropriate security controls';
  }

  private calculateCVSSScore(type: SecurityVulnerability['type']): number {
    const cvssScores = {
      'SQL_INJECTION': 8.5,
      'XSS': 6.1,
      'CSRF': 5.4,
      'AUTH_BYPASS': 9.8,
      'FILE_UPLOAD': 7.2,
      'SESSION_HIJACK': 7.5,
      'PRIVILEGE_ESCALATION': 9.3
    };

    return cvssScores[type] || 5.0;
  }

  private calculateOverallRisk(vulnerabilities: SecurityVulnerability[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (vulnerabilities.some(v => v.severity === 'CRITICAL')) return 'CRITICAL';
    if (vulnerabilities.some(v => v.severity === 'HIGH')) return 'HIGH';
    if (vulnerabilities.some(v => v.severity === 'MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations = [];

    const vulnTypes = new Set(vulnerabilities.map(v => v.type));

    if (vulnTypes.has('SQL_INJECTION')) {
      recommendations.push('Implement parameterized queries and input validation across all database interactions');
    }

    if (vulnTypes.has('XSS')) {
      recommendations.push('Deploy Content Security Policy and implement proper output encoding');
    }

    if (vulnTypes.has('AUTH_BYPASS')) {
      recommendations.push('Review and strengthen authentication mechanisms immediately');
    }

    if (vulnerabilities.length === 0) {
      recommendations.push('Maintain current security practices and continue regular testing');
    }

    return recommendations;
  }

  private assessCompliance(vulnerabilities: SecurityVulnerability[]): any {
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highVulns = vulnerabilities.filter(v => v.severity === 'HIGH').length;

    return {
      owasp: criticalVulns === 0 && highVulns <= 2 ? 'COMPLIANT' : 'NON_COMPLIANT',
      iso27001: criticalVulns === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
      pciDss: vulnerabilities.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT'
    };
  }

  // Public API methods
  public async runFullSecurityScan(): Promise<{
    success: boolean;
    results: PenetrationTestResults[];
    overallRisk: string;
    totalVulnerabilities: number;
  }> {
    const results: PenetrationTestResults[] = [];
    let totalVulnerabilities = 0;
    let maxRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    try {
      for (const [suiteId] of this.testSuites) {
        const result = await this.executePenetrationTest(suiteId);
        results.push(result);
        totalVulnerabilities += result.vulnerabilities.length;
        
        if (this.getRiskLevel(result.overallRisk) > this.getRiskLevel(maxRisk)) {
          maxRisk = result.overallRisk;
        }
      }

      return {
        success: true,
        results,
        overallRisk: maxRisk,
        totalVulnerabilities
      };
    } catch (error) {
      console.error('Full security scan failed:', error);
      return {
        success: false,
        results,
        overallRisk: maxRisk,
        totalVulnerabilities
      };
    }
  }

  private getRiskLevel(risk: string): number {
    const levels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    return levels[risk as keyof typeof levels] || 0;
  }

  // Vulnerability management
  public getVulnerabilities(severity?: SecurityVulnerability['severity']): SecurityVulnerability[] {
    let filtered = [...this.vulnerabilities];
    
    if (severity) {
      filtered = filtered.filter(v => v.severity === severity);
    }

    return filtered.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  public markVulnerabilityFixed(vulnerabilityId: string): boolean {
    const vulnerability = this.vulnerabilities.find(v => v.id === vulnerabilityId);
    if (vulnerability) {
      vulnerability.status = 'FIXED';
      this.saveTestResults();
      return true;
    }
    return false;
  }

  public getSecurityMetrics(): {
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    fixedVulnerabilities: number;
    averageCVSSScore: number;
    lastScanDate?: Date;
    complianceScore: number;
  } {
    const totalVulns = this.vulnerabilities.length;
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highVulns = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const fixedVulns = this.vulnerabilities.filter(v => v.status === 'FIXED').length;
    
    const cvssScores = this.vulnerabilities
      .map(v => v.cvssScore)
      .filter(score => score !== undefined) as number[];
    const averageCVSS = cvssScores.length > 0
      ? cvssScores.reduce((sum, score) => sum + score, 0) / cvssScores.length
      : 0;

    const lastScan = Array.from(this.testSuites.values())
      .map(suite => suite.executedAt)
      .filter(date => date)
      .sort((a, b) => b!.getTime() - a!.getTime())[0];

    // Calculate compliance score (100 - vulnerabilities penalty)
    let complianceScore = 100;
    complianceScore -= criticalVulns * 25;
    complianceScore -= highVulns * 15;
    complianceScore -= (totalVulns - criticalVulns - highVulns) * 5;
    complianceScore = Math.max(0, complianceScore);

    return {
      totalVulnerabilities: totalVulns,
      criticalVulnerabilities: criticalVulns,
      highVulnerabilities: highVulns,
      fixedVulnerabilities: fixedVulns,
      averageCVSSScore: averageCVSS,
      lastScanDate: lastScan,
      complianceScore
    };
  }

  // Storage methods
  private loadVulnerabilities(): void {
    const saved = localStorage.getItem('saleskik-security-vulnerabilities');
    if (saved) {
      try {
        this.vulnerabilities = JSON.parse(saved).map((vuln: any) => ({
          ...vuln,
          discoveredAt: new Date(vuln.discoveredAt)
        }));
      } catch (error) {
        console.error('Error loading vulnerabilities:', error);
      }
    }
  }

  private saveTestResults(): void {
    localStorage.setItem('saleskik-security-vulnerabilities', JSON.stringify(this.vulnerabilities));
    
    const suitesArray = Array.from(this.testSuites.values());
    localStorage.setItem('saleskik-penetration-tests', JSON.stringify(suitesArray));
  }
}

export default PenetrationTestingService;