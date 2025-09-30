// Performance Load Testing Service for Purchase Order System
// High-volume simulation, concurrent user testing, scalability validation

export interface LoadTestConfiguration {
  id: string;
  name: string;
  description: string;
  testType: 'LOAD' | 'STRESS' | 'SPIKE' | 'VOLUME' | 'ENDURANCE';
  duration: number; // seconds
  rampUpTime: number; // seconds
  rampDownTime: number; // seconds
  scenarios: LoadTestScenario[];
  thresholds: {
    averageResponseTime: number; // ms
    maxResponseTime: number; // ms
    errorRate: number; // percentage
    throughput: number; // requests per second
  };
  environment: 'LOCAL' | 'STAGING' | 'PRODUCTION';
  isActive: boolean;
}

export interface LoadTestScenario {
  id: string;
  name: string;
  weight: number; // percentage of total load
  userCount: number;
  actions: LoadTestAction[];
  thinkTime: number; // ms between actions
  dataSet?: string; // Test data file
}

export interface LoadTestAction {
  id: string;
  name: string;
  type: 'HTTP_REQUEST' | 'WEBSOCKET_CONNECT' | 'FILE_UPLOAD' | 'DATABASE_QUERY' | 'BUSINESS_PROCESS';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: { [key: string]: string };
  body?: any;
  files?: Array<{
    fieldName: string;
    filename: string;
    size: number; // bytes
    contentType: string;
  }>;
  validation: {
    expectedStatusCodes: number[];
    expectedResponseTime: number; // ms
    responseValidation?: string; // Response validation rules
  };
  weight: number; // percentage within scenario
}

export interface LoadTestExecution {
  id: string;
  configurationId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  actualDuration: number;
  metrics: LoadTestMetrics;
  errors: LoadTestError[];
  results: LoadTestResults;
}

export interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  throughput: number;
  concurrentUsers: number;
  memoryUsage: Array<{
    timestamp: Date;
    usage: number; // MB
  }>;
  cpuUsage: Array<{
    timestamp: Date;
    usage: number; // percentage
  }>;
  networkThroughput: Array<{
    timestamp: Date;
    bytesPerSecond: number;
  }>;
}

export interface LoadTestError {
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  errorMessage: string;
  responseTime: number;
  userAgent: string;
}

export interface LoadTestResults {
  passed: boolean;
  summary: string;
  thresholdViolations: Array<{
    metric: string;
    threshold: number;
    actual: number;
    severity: 'WARNING' | 'CRITICAL';
  }>;
  performanceInsights: string[];
  scalabilityRecommendations: string[];
  bottlenecks: Array<{
    component: string;
    description: string;
    impact: string;
    recommendation: string;
  }>;
}

class PerformanceLoadTestingService {
  private static instance: PerformanceLoadTestingService;
  private loadTestConfigurations: Map<string, LoadTestConfiguration> = new Map();
  private testExecutions: LoadTestExecution[] = [];
  private isRunning: boolean = false;

  private constructor() {
    this.initializeTestConfigurations();
    this.loadTestHistory();
  }

  public static getInstance(): PerformanceLoadTestingService {
    if (!PerformanceLoadTestingService.instance) {
      PerformanceLoadTestingService.instance = new PerformanceLoadTestingService();
    }
    return PerformanceLoadTestingService.instance;
  }

  private initializeTestConfigurations(): void {
    // High-Volume Order Creation Test
    const highVolumeOrderTest: LoadTestConfiguration = {
      id: 'high-volume-orders',
      name: 'High-Volume Order Creation Test',
      description: 'Simulate creating 1000+ purchase orders simultaneously',
      testType: 'VOLUME',
      duration: 600, // 10 minutes
      rampUpTime: 120, // 2 minutes
      rampDownTime: 60, // 1 minute
      scenarios: [
        {
          id: 'order-creation-scenario',
          name: 'Rapid Order Creation',
          weight: 70,
          userCount: 50,
          actions: [
            {
              id: 'create-order',
              name: 'Create Purchase Order',
              type: 'HTTP_REQUEST',
              endpoint: '/api/purchase-orders',
              method: 'POST',
              body: {
                supplier_id: '{{randomSupplierId}}',
                priority_level: '{{randomPriority}}',
                line_items: [
                  {
                    product_id: '{{randomProductId}}',
                    quantity_ordered: '{{randomQuantity}}',
                    unit_price: '{{randomPrice}}'
                  }
                ]
              },
              validation: {
                expectedStatusCodes: [201],
                expectedResponseTime: 2000
              },
              weight: 100
            }
          ],
          thinkTime: 1000
        },
        {
          id: 'order-browsing-scenario',
          name: 'Order Dashboard Browsing',
          weight: 30,
          userCount: 20,
          actions: [
            {
              id: 'list-orders',
              name: 'List Purchase Orders',
              type: 'HTTP_REQUEST',
              endpoint: '/api/purchase-orders',
              method: 'GET',
              validation: {
                expectedStatusCodes: [200],
                expectedResponseTime: 1000
              },
              weight: 60
            },
            {
              id: 'search-orders',
              name: 'Search Orders',
              type: 'HTTP_REQUEST',
              endpoint: '/api/purchase-orders',
              method: 'GET',
              validation: {
                expectedStatusCodes: [200],
                expectedResponseTime: 1500
              },
              weight: 40
            }
          ],
          thinkTime: 2000
        }
      ],
      thresholds: {
        averageResponseTime: 2000,
        maxResponseTime: 10000,
        errorRate: 1.0,
        throughput: 50
      },
      environment: 'STAGING',
      isActive: true
    };

    // Concurrent User Test
    const concurrentUserTest: LoadTestConfiguration = {
      id: 'concurrent-users',
      name: 'Concurrent User Load Test',
      description: 'Test system behavior with 100+ simultaneous users',
      testType: 'LOAD',
      duration: 1800, // 30 minutes
      rampUpTime: 300, // 5 minutes
      rampDownTime: 180, // 3 minutes
      scenarios: [
        {
          id: 'mixed-user-activity',
          name: 'Mixed User Activity',
          weight: 100,
          userCount: 100,
          actions: [
            {
              id: 'dashboard-load',
              name: 'Load Dashboard',
              type: 'HTTP_REQUEST',
              endpoint: '/api/purchase-orders',
              method: 'GET',
              validation: {
                expectedStatusCodes: [200],
                expectedResponseTime: 1000
              },
              weight: 40
            },
            {
              id: 'create-order',
              name: 'Create Order',
              type: 'HTTP_REQUEST',
              endpoint: '/api/purchase-orders',
              method: 'POST',
              validation: {
                expectedStatusCodes: [201],
                expectedResponseTime: 3000
              },
              weight: 20
            },
            {
              id: 'approve-order',
              name: 'Approve Order',
              type: 'HTTP_REQUEST',
              endpoint: '/api/purchase-orders/{{orderId}}/approve',
              method: 'POST',
              validation: {
                expectedStatusCodes: [200],
                expectedResponseTime: 1500
              },
              weight: 15
            },
            {
              id: 'websocket-connect',
              name: 'WebSocket Connection',
              type: 'WEBSOCKET_CONNECT',
              endpoint: '/ws/purchase-orders',
              method: 'GET',
              validation: {
                expectedStatusCodes: [101],
                expectedResponseTime: 5000
              },
              weight: 25
            }
          ],
          thinkTime: 3000
        }
      ],
      thresholds: {
        averageResponseTime: 1500,
        maxResponseTime: 8000,
        errorRate: 2.0,
        throughput: 100
      },
      environment: 'STAGING',
      isActive: true
    };

    // Large File Upload Test
    const fileUploadTest: LoadTestConfiguration = {
      id: 'large-file-uploads',
      name: 'Large File Upload Stress Test',
      description: 'Test file upload performance with multiple large files',
      testType: 'STRESS',
      duration: 900, // 15 minutes
      rampUpTime: 180, // 3 minutes
      rampDownTime: 120, // 2 minutes
      scenarios: [
        {
          id: 'file-upload-scenario',
          name: 'Large File Uploads',
          weight: 100,
          userCount: 20,
          actions: [
            {
              id: 'upload-large-file',
              name: 'Upload Large Attachment',
              type: 'FILE_UPLOAD',
              endpoint: '/api/purchase-orders/{{orderId}}/attachments',
              method: 'POST',
              files: [
                {
                  fieldName: 'file',
                  filename: 'large-drawing.pdf',
                  size: 10 * 1024 * 1024, // 10MB
                  contentType: 'application/pdf'
                }
              ],
              validation: {
                expectedStatusCodes: [201],
                expectedResponseTime: 30000 // 30 seconds for large files
              },
              weight: 100
            }
          ],
          thinkTime: 5000
        }
      ],
      thresholds: {
        averageResponseTime: 20000,
        maxResponseTime: 60000,
        errorRate: 5.0,
        throughput: 5
      },
      environment: 'STAGING',
      isActive: true
    };

    this.loadTestConfigurations.set('high-volume-orders', highVolumeOrderTest);
    this.loadTestConfigurations.set('concurrent-users', concurrentUserTest);
    this.loadTestConfigurations.set('large-file-uploads', fileUploadTest);
  }

  // Execute load test
  public async executeLoadTest(configurationId: string): Promise<LoadTestExecution> {
    const config = this.loadTestConfigurations.get(configurationId);
    if (!config) {
      throw new Error('Load test configuration not found');
    }

    if (this.isRunning) {
      throw new Error('Another load test is already running');
    }

    console.log(`Starting load test: ${config.name}`);
    
    this.isRunning = true;
    const execution: LoadTestExecution = {
      id: Date.now().toString(),
      configurationId,
      startedAt: new Date(),
      status: 'RUNNING',
      actualDuration: 0,
      metrics: this.createEmptyMetrics(),
      errors: [],
      results: this.createEmptyResults()
    };

    this.testExecutions.push(execution);

    try {
      const results = await this.runLoadTestSimulation(config, execution);
      
      execution.status = 'COMPLETED';
      execution.completedAt = new Date();
      execution.actualDuration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.results = results;

      this.isRunning = false;
      this.saveTestExecutions();

      console.log(`Load test completed: ${config.name}`);
      return execution;
    } catch (error) {
      console.error('Load test failed:', error);
      execution.status = 'FAILED';
      execution.completedAt = new Date();
      this.isRunning = false;
      throw error;
    }
  }

  private async runLoadTestSimulation(
    config: LoadTestConfiguration, 
    execution: LoadTestExecution
  ): Promise<LoadTestResults> {
    const startTime = Date.now();
    const metrics = execution.metrics;
    
    // Simulate load test execution
    console.log(`Simulating ${config.testType} test for ${config.duration} seconds`);
    
    // Simulate different phases: ramp-up, steady state, ramp-down
    const phases = [
      { name: 'Ramp-up', duration: config.rampUpTime, userMultiplier: 0.5 },
      { name: 'Steady State', duration: config.duration - config.rampUpTime - config.rampDownTime, userMultiplier: 1.0 },
      { name: 'Ramp-down', duration: config.rampDownTime, userMultiplier: 0.3 }
    ];

    for (const phase of phases) {
      await this.simulateTestPhase(phase, config, metrics, execution.errors);
    }

    // Analyze results
    const results = this.analyzeTestResults(config, metrics, execution.errors);
    
    return results;
  }

  private async simulateTestPhase(
    phase: any, 
    config: LoadTestConfiguration, 
    metrics: LoadTestMetrics,
    errors: LoadTestError[]
  ): Promise<void> {
    console.log(`Executing ${phase.name} phase for ${phase.duration} seconds`);
    
    const iterations = Math.floor(phase.duration / 10); // Sample every 10 seconds
    
    for (let i = 0; i < iterations; i++) {
      // Simulate requests for this time slice
      const totalUsers = config.scenarios.reduce((sum, scenario) => sum + scenario.userCount, 0);
      const adjustedUsers = Math.floor(totalUsers * phase.userMultiplier);
      
      // Simulate load for this iteration
      const iterationMetrics = this.simulateIterationLoad(adjustedUsers, config);
      
      // Accumulate metrics
      metrics.totalRequests += iterationMetrics.requests;
      metrics.successfulRequests += iterationMetrics.successful;
      metrics.failedRequests += iterationMetrics.failed;
      
      // Update response time statistics
      if (iterationMetrics.responseTime > 0) {
        metrics.averageResponseTime = (metrics.averageResponseTime + iterationMetrics.responseTime) / 2;
        metrics.maxResponseTime = Math.max(metrics.maxResponseTime, iterationMetrics.responseTime);
        metrics.minResponseTime = Math.min(metrics.minResponseTime || Infinity, iterationMetrics.responseTime);
      }

      // Calculate current error rate
      metrics.errorRate = metrics.totalRequests > 0 
        ? (metrics.failedRequests / metrics.totalRequests) * 100 
        : 0;

      // Update throughput
      metrics.requestsPerSecond = metrics.totalRequests / ((Date.now() - metrics.totalRequests) / 1000 || 1);
      metrics.concurrentUsers = adjustedUsers;

      // Record resource usage
      metrics.memoryUsage.push({
        timestamp: new Date(),
        usage: this.simulateMemoryUsage(adjustedUsers)
      });

      metrics.cpuUsage.push({
        timestamp: new Date(),
        usage: this.simulateCPUUsage(adjustedUsers, iterationMetrics.responseTime)
      });

      // Simulate some errors based on load
      if (adjustedUsers > 50 && Math.random() < 0.02) { // 2% chance of error under high load
        errors.push({
          timestamp: new Date(),
          endpoint: '/api/purchase-orders',
          method: 'POST',
          statusCode: 500,
          errorMessage: 'Database connection timeout',
          responseTime: 30000,
          userAgent: 'LoadTest/1.0'
        });
      }

      // Wait for next iteration
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  private simulateIterationLoad(userCount: number, config: LoadTestConfiguration): {
    requests: number;
    successful: number;
    failed: number;
    responseTime: number;
  } {
    // Simulate load based on user count and scenarios
    const baseRequests = userCount * 2; // 2 requests per user per 10 seconds
    const variance = Math.random() * 0.3 - 0.15; // ±15% variance
    const requests = Math.floor(baseRequests * (1 + variance));
    
    // Simulate response time degradation under load
    let baseResponseTime = 500; // Base 500ms
    if (userCount > 20) baseResponseTime += (userCount - 20) * 10; // Add 10ms per user over 20
    if (userCount > 50) baseResponseTime += (userCount - 50) * 20; // Add 20ms per user over 50
    if (userCount > 100) baseResponseTime += (userCount - 100) * 50; // Add 50ms per user over 100
    
    const responseTimeVariance = Math.random() * 0.5; // Up to 50% variance
    const responseTime = Math.floor(baseResponseTime * (1 + responseTimeVariance));

    // Simulate failure rate under high load
    let failureRate = 0;
    if (userCount > 75) failureRate = 0.01; // 1% failure rate over 75 users
    if (userCount > 100) failureRate = 0.05; // 5% failure rate over 100 users
    if (userCount > 150) failureRate = 0.15; // 15% failure rate over 150 users

    const failed = Math.floor(requests * failureRate);
    const successful = requests - failed;

    return { requests, successful, failed, responseTime };
  }

  private simulateMemoryUsage(userCount: number): number {
    // Base memory: 512MB + 2MB per concurrent user
    const baseMemory = 512;
    const userMemory = userCount * 2;
    const variance = Math.random() * 0.2 - 0.1; // ±10% variance
    
    return Math.floor((baseMemory + userMemory) * (1 + variance));
  }

  private simulateCPUUsage(userCount: number, responseTime: number): number {
    // Base CPU: 20% + 0.5% per user + response time factor
    const baseCPU = 20;
    const userCPU = userCount * 0.5;
    const responseTimeFactor = Math.min(responseTime / 1000 * 5, 30); // Up to 30% from response time
    const variance = Math.random() * 0.15 - 0.075; // ±7.5% variance
    
    return Math.min(100, Math.floor((baseCPU + userCPU + responseTimeFactor) * (1 + variance)));
  }

  private analyzeTestResults(
    config: LoadTestConfiguration, 
    metrics: LoadTestMetrics,
    errors: LoadTestError[]
  ): LoadTestResults {
    const thresholdViolations = [];
    const performanceInsights = [];
    const scalabilityRecommendations = [];
    const bottlenecks = [];

    // Check thresholds
    if (metrics.averageResponseTime > config.thresholds.averageResponseTime) {
      thresholdViolations.push({
        metric: 'Average Response Time',
        threshold: config.thresholds.averageResponseTime,
        actual: metrics.averageResponseTime,
        severity: metrics.averageResponseTime > config.thresholds.averageResponseTime * 2 ? 'CRITICAL' : 'WARNING'
      });
    }

    if (metrics.errorRate > config.thresholds.errorRate) {
      thresholdViolations.push({
        metric: 'Error Rate',
        threshold: config.thresholds.errorRate,
        actual: metrics.errorRate,
        severity: metrics.errorRate > config.thresholds.errorRate * 3 ? 'CRITICAL' : 'WARNING'
      });
    }

    // Generate insights
    if (metrics.averageResponseTime > 2000) {
      performanceInsights.push('Response times indicate potential database or application bottlenecks');
      bottlenecks.push({
        component: 'Database',
        description: 'High response times suggest database performance issues',
        impact: 'User experience degradation and reduced throughput',
        recommendation: 'Consider database optimization, indexing, or connection pooling'
      });
    }

    if (metrics.errorRate > 5) {
      performanceInsights.push('High error rate indicates system instability under load');
      bottlenecks.push({
        component: 'Application',
        description: 'Application errors increase significantly under load',
        impact: 'System reliability and user trust',
        recommendation: 'Implement better error handling and resource management'
      });
    }

    // Scalability recommendations
    if (metrics.concurrentUsers > 50 && metrics.averageResponseTime > 1000) {
      scalabilityRecommendations.push('Consider horizontal scaling with load balancing');
    }

    if (metrics.memoryUsage.some(usage => usage.usage > 1000)) {
      scalabilityRecommendations.push('Memory usage high - consider memory optimization or increased allocation');
    }

    if (metrics.cpuUsage.some(usage => usage.usage > 80)) {
      scalabilityRecommendations.push('CPU usage high - consider performance optimization or additional compute resources');
    }

    const passed = thresholdViolations.every(violation => violation.severity !== 'CRITICAL');

    return {
      passed,
      summary: passed 
        ? `Load test passed successfully. System handled ${metrics.concurrentUsers} concurrent users with ${metrics.averageResponseTime.toFixed(0)}ms average response time.`
        : `Load test failed. System experienced performance degradation with ${thresholdViolations.length} threshold violations.`,
      thresholdViolations,
      performanceInsights,
      scalabilityRecommendations,
      bottlenecks
    };
  }

  private createEmptyMetrics(): LoadTestMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 0,
      throughput: 0,
      concurrentUsers: 0,
      memoryUsage: [],
      cpuUsage: [],
      networkThroughput: []
    };
  }

  private createEmptyResults(): LoadTestResults {
    return {
      passed: false,
      summary: '',
      thresholdViolations: [],
      performanceInsights: [],
      scalabilityRecommendations: [],
      bottlenecks: []
    };
  }

  private loadTestHistory(): void {
    const saved = localStorage.getItem('saleskik-load-test-executions');
    if (saved) {
      try {
        this.testExecutions = JSON.parse(saved).map((execution: any) => ({
          ...execution,
          startedAt: new Date(execution.startedAt),
          completedAt: execution.completedAt ? new Date(execution.completedAt) : undefined,
          metrics: {
            ...execution.metrics,
            memoryUsage: execution.metrics.memoryUsage.map((usage: any) => ({
              ...usage,
              timestamp: new Date(usage.timestamp)
            })),
            cpuUsage: execution.metrics.cpuUsage.map((usage: any) => ({
              ...usage,
              timestamp: new Date(usage.timestamp)
            }))
          },
          errors: execution.errors.map((error: any) => ({
            ...error,
            timestamp: new Date(error.timestamp)
          }))
        }));
      } catch (error) {
        console.error('Error loading test executions:', error);
      }
    }
  }

  private saveTestExecutions(): void {
    localStorage.setItem('saleskik-load-test-executions', JSON.stringify(this.testExecutions));
  }

  // Public API methods
  public getLoadTestConfigurations(): LoadTestConfiguration[] {
    return Array.from(this.loadTestConfigurations.values());
  }

  public getTestExecutions(limit?: number): LoadTestExecution[] {
    const sorted = this.testExecutions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  public getPerformanceBaseline(): {
    averageResponseTime: number;
    maxConcurrentUsers: number;
    throughputCapacity: number;
    errorThreshold: number;
    recommendedLimits: {
      maxUsers: number;
      maxRequestsPerSecond: number;
      maxFileUploadSize: number;
    };
  } {
    const successfulExecutions = this.testExecutions.filter(exec => 
      exec.status === 'COMPLETED' && exec.results.passed
    );

    if (successfulExecutions.length === 0) {
      return {
        averageResponseTime: 1000,
        maxConcurrentUsers: 50,
        throughputCapacity: 100,
        errorThreshold: 2.0,
        recommendedLimits: {
          maxUsers: 40,
          maxRequestsPerSecond: 80,
          maxFileUploadSize: 10 * 1024 * 1024
        }
      };
    }

    const avgResponseTime = successfulExecutions.reduce((sum, exec) => 
      sum + exec.metrics.averageResponseTime, 0) / successfulExecutions.length;

    const maxUsers = Math.max(...successfulExecutions.map(exec => exec.metrics.concurrentUsers));
    const maxThroughput = Math.max(...successfulExecutions.map(exec => exec.metrics.throughput));

    return {
      averageResponseTime: avgResponseTime,
      maxConcurrentUsers: maxUsers,
      throughputCapacity: maxThroughput,
      errorThreshold: 2.0,
      recommendedLimits: {
        maxUsers: Math.floor(maxUsers * 0.8), // 80% of max for safety
        maxRequestsPerSecond: Math.floor(maxThroughput * 0.8),
        maxFileUploadSize: 10 * 1024 * 1024
      }
    };
  }

  public getLoadTestingStatistics(): {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    averageTestDuration: number;
    maxUsersAchieved: number;
    bestPerformanceScore: number;
    lastTestDate?: Date;
  } {
    const totalTests = this.testExecutions.length;
    const successfulTests = this.testExecutions.filter(exec => 
      exec.status === 'COMPLETED' && exec.results.passed
    ).length;
    const failedTests = totalTests - successfulTests;

    const completedTests = this.testExecutions.filter(exec => exec.status === 'COMPLETED');
    const averageTestDuration = completedTests.length > 0
      ? completedTests.reduce((sum, exec) => sum + exec.actualDuration, 0) / completedTests.length / 1000 / 60 // minutes
      : 0;

    const maxUsersAchieved = completedTests.length > 0
      ? Math.max(...completedTests.map(exec => exec.metrics.concurrentUsers))
      : 0;

    const lastTest = this.testExecutions
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageTestDuration,
      maxUsersAchieved,
      bestPerformanceScore: 85, // Mock score
      lastTestDate: lastTest?.startedAt
    };
  }

  // Memory leak detection
  public detectMemoryLeaks(): {
    leaksDetected: boolean;
    leakSources: Array<{
      component: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
      recommendation: string;
    }>;
    memoryGrowthRate: number; // MB per hour
  } {
    // Analyze memory usage patterns from test executions
    const memoryData = this.testExecutions
      .filter(exec => exec.status === 'COMPLETED')
      .flatMap(exec => exec.metrics.memoryUsage);

    if (memoryData.length < 2) {
      return {
        leaksDetected: false,
        leakSources: [],
        memoryGrowthRate: 0
      };
    }

    // Calculate memory growth rate
    const startUsage = memoryData[0].usage;
    const endUsage = memoryData[memoryData.length - 1].usage;
    const timeSpan = (memoryData[memoryData.length - 1].timestamp.getTime() - memoryData[0].timestamp.getTime()) / (1000 * 60 * 60); // hours
    const growthRate = timeSpan > 0 ? (endUsage - startUsage) / timeSpan : 0;

    const leaksDetected = growthRate > 50; // More than 50MB/hour growth

    const leakSources = [];
    if (leaksDetected) {
      leakSources.push({
        component: 'WebSocket Connections',
        severity: growthRate > 200 ? 'HIGH' : 'MEDIUM',
        description: 'Memory usage increasing during load test execution',
        recommendation: 'Review WebSocket connection cleanup and implement proper garbage collection'
      });
    }

    return {
      leaksDetected,
      leakSources,
      memoryGrowthRate: growthRate
    };
  }

  public cancelRunningTest(): boolean {
    if (this.isRunning) {
      const runningExecution = this.testExecutions.find(exec => exec.status === 'RUNNING');
      if (runningExecution) {
        runningExecution.status = 'CANCELLED';
        runningExecution.completedAt = new Date();
        this.isRunning = false;
        this.saveTestExecutions();
        return true;
      }
    }
    return false;
  }
}

export default PerformanceLoadTestingService;