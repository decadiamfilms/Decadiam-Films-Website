// Performance Monitoring Service for Purchase Order System
// Database query performance, user activity monitoring, system health alerts

export interface PerformanceMetric {
  id: string;
  metricType: 'DATABASE_QUERY' | 'API_RESPONSE' | 'USER_ACTION' | 'SYSTEM_RESOURCE' | 'BUSINESS_PROCESS';
  name: string;
  value: number;
  unit: 'ms' | 'seconds' | 'count' | 'percentage' | 'bytes' | 'mb' | 'requests_per_second';
  timestamp: Date;
  tags: { [key: string]: string };
  threshold?: {
    warning: number;
    critical: number;
  };
  context?: {
    userId?: string;
    purchaseOrderId?: string;
    supplierId?: string;
    sessionId?: string;
    endpoint?: string;
    query?: string;
  };
}

export interface DatabaseQueryMetric {
  id: string;
  query: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  executionTime: number; // milliseconds
  rowsAffected: number;
  tableName: string;
  endpoint: string;
  userId: string;
  timestamp: Date;
  wasSlowQuery: boolean;
  indexesUsed: string[];
  explanationPlan?: any;
}

export interface UserActivityMetric {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'PAGE_VIEW' | 'ORDER_CREATE' | 'ORDER_UPDATE' | 'APPROVAL_ACTION' | 
          'SUPPLIER_CONTACT' | 'REPORT_GENERATE' | 'SEARCH_PERFORM' | 'FILE_UPLOAD';
  purchaseOrderContext?: string;
  duration: number; // milliseconds
  successful: boolean;
  errorMessage?: string;
  timestamp: Date;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  pageUrl: string;
  referrer?: string;
}

export interface SystemHealthAlert {
  id: string;
  alertType: 'PERFORMANCE_DEGRADATION' | 'HIGH_RESOURCE_USAGE' | 'SLOW_DATABASE' | 
            'API_ERRORS' | 'WEBSOCKET_ISSUES' | 'EXTERNAL_SERVICE_DOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedServices: string[];
  metrics: PerformanceMetric[];
  triggeredAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  autoResolved: boolean;
  notificationsSent: string[];
}

export interface PerformanceDashboardData {
  overview: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    databaseConnectionPool: number;
    activeUsers: number;
    systemUptime: number;
  };
  purchaseOrderMetrics: {
    ordersCreatedToday: number;
    averageOrderCreationTime: number;
    averageApprovalTime: number;
    averageSupplierResponseTime: number;
    orderCompletionRate: number;
    criticalOrdersCount: number;
  };
  databasePerformance: {
    averageQueryTime: number;
    slowQueriesCount: number;
    connectionPoolUsage: number;
    lockWaitTime: number;
    indexHitRatio: number;
    transactionsPerSecond: number;
  };
  userActivity: {
    activeSessionsCount: number;
    averageSessionDuration: number;
    mostActiveUsers: Array<{ userId: string; actionCount: number }>;
    popularActions: Array<{ action: string; count: number }>;
    errorsByUser: Array<{ userId: string; errorCount: number }>;
  };
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkThroughput: number;
    cacheHitRatio: number;
  };
  alerts: SystemHealthAlert[];
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private databaseMetrics: DatabaseQueryMetric[] = [];
  private userActivityMetrics: UserActivityMetric[] = [];
  private systemAlerts: SystemHealthAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadPerformanceData();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  private loadPerformanceData(): void {
    // Load metrics from localStorage
    const savedMetrics = localStorage.getItem('saleskik-performance-metrics');
    if (savedMetrics) {
      try {
        this.metrics = JSON.parse(savedMetrics).map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        }));
      } catch (error) {
        console.error('Error loading performance metrics:', error);
      }
    }

    // Load database metrics
    const savedDbMetrics = localStorage.getItem('saleskik-database-metrics');
    if (savedDbMetrics) {
      try {
        this.databaseMetrics = JSON.parse(savedDbMetrics).map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        }));
      } catch (error) {
        console.error('Error loading database metrics:', error);
      }
    }

    // Load user activity metrics
    const savedUserMetrics = localStorage.getItem('saleskik-user-activity-metrics');
    if (savedUserMetrics) {
      try {
        this.userActivityMetrics = JSON.parse(savedUserMetrics).map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        }));
      } catch (error) {
        console.error('Error loading user activity metrics:', error);
      }
    }
  }

  private startPerformanceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor performance every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.analyzePerformance();
      this.checkHealthThresholds();
    }, 30000);

    // Initial collection
    this.collectSystemMetrics();
  }

  // Database query performance tracking
  public trackDatabaseQuery(queryData: {
    query: string;
    executionTime: number;
    rowsAffected: number;
    tableName: string;
    endpoint: string;
    userId: string;
  }): void {
    const dbMetric: DatabaseQueryMetric = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      queryType: this.extractQueryType(queryData.query),
      wasSlowQuery: queryData.executionTime > 1000, // > 1 second
      indexesUsed: this.extractIndexUsage(queryData.query, queryData.tableName),
      timestamp: new Date(),
      ...queryData
    };

    this.databaseMetrics.push(dbMetric);
    this.saveDatabaseMetrics();

    // Alert on slow queries
    if (dbMetric.wasSlowQuery) {
      this.createPerformanceAlert('SLOW_DATABASE', 'HIGH', 
        `Slow query detected: ${queryData.executionTime}ms on ${queryData.tableName}`,
        [dbMetric.endpoint]
      );
    }

    // Track as general performance metric
    this.recordMetric({
      metricType: 'DATABASE_QUERY',
      name: `database_query_${queryData.tableName}`,
      value: queryData.executionTime,
      unit: 'ms',
      tags: {
        table: queryData.tableName,
        queryType: dbMetric.queryType,
        endpoint: queryData.endpoint
      },
      threshold: { warning: 500, critical: 1000 },
      context: {
        userId: queryData.userId,
        query: queryData.query
      }
    });
  }

  // User activity monitoring
  public trackUserActivity(activityData: {
    action: UserActivityMetric['action'];
    purchaseOrderContext?: string;
    duration: number;
    successful: boolean;
    errorMessage?: string;
    pageUrl: string;
    referrer?: string;
  }): void {
    const userMetric: UserActivityMetric = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      userRole: this.getCurrentUserRole(),
      sessionId: this.getCurrentSessionId(),
      ipAddress: this.getCurrentIPAddress(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      ...activityData
    };

    this.userActivityMetrics.push(userMetric);
    this.saveUserActivityMetrics();

    // Track performance metrics
    this.recordMetric({
      metricType: 'USER_ACTION',
      name: `user_action_${activityData.action.toLowerCase()}`,
      value: activityData.duration,
      unit: 'ms',
      tags: {
        action: activityData.action,
        successful: activityData.successful.toString(),
        userRole: userMetric.userRole
      },
      context: {
        userId: userMetric.userId,
        purchaseOrderId: activityData.purchaseOrderContext
      }
    });

    // Alert on user errors
    if (!activityData.successful) {
      this.recordMetric({
        metricType: 'API_RESPONSE',
        name: 'user_action_error',
        value: 1,
        unit: 'count',
        tags: {
          action: activityData.action,
          error: activityData.errorMessage || 'unknown'
        }
      });
    }
  }

  // API response time tracking
  public trackAPIResponse(endpointData: {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    userId?: string;
    purchaseOrderId?: string;
  }): void {
    this.recordMetric({
      metricType: 'API_RESPONSE',
      name: `api_response_${endpointData.method.toLowerCase()}_${endpointData.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
      value: endpointData.responseTime,
      unit: 'ms',
      tags: {
        endpoint: endpointData.endpoint,
        method: endpointData.method,
        statusCode: endpointData.statusCode.toString(),
        category: this.categorizeEndpoint(endpointData.endpoint)
      },
      threshold: { warning: 2000, critical: 5000 },
      context: {
        userId: endpointData.userId,
        purchaseOrderId: endpointData.purchaseOrderId,
        endpoint: endpointData.endpoint
      }
    });

    // Alert on slow API responses
    if (endpointData.responseTime > 5000) {
      this.createPerformanceAlert('PERFORMANCE_DEGRADATION', 'HIGH',
        `Slow API response: ${endpointData.endpoint} took ${endpointData.responseTime}ms`,
        [endpointData.endpoint]
      );
    }
  }

  // Business process performance tracking
  public trackBusinessProcess(processData: {
    processName: 'ORDER_CREATION' | 'APPROVAL_WORKFLOW' | 'SUPPLIER_CONFIRMATION' | 
                'GOODS_RECEIPT' | 'INVOICE_PROCESSING' | 'ORDER_COMPLETION';
    purchaseOrderId: string;
    duration: number;
    successful: boolean;
    stepsCompleted: number;
    totalSteps: number;
    bottlenecks?: string[];
  }): void {
    this.recordMetric({
      metricType: 'BUSINESS_PROCESS',
      name: `business_process_${processData.processName.toLowerCase()}`,
      value: processData.duration,
      unit: 'ms',
      tags: {
        process: processData.processName,
        successful: processData.successful.toString(),
        efficiency: (processData.stepsCompleted / processData.totalSteps * 100).toFixed(0) + '%'
      },
      context: {
        purchaseOrderId: processData.purchaseOrderId
      }
    });

    // Track process efficiency
    const efficiency = processData.stepsCompleted / processData.totalSteps;
    if (efficiency < 0.8) {
      this.createPerformanceAlert('PERFORMANCE_DEGRADATION', 'MEDIUM',
        `Business process inefficiency: ${processData.processName} only ${(efficiency * 100).toFixed(0)}% efficient`,
        ['business-processes']
      );
    }
  }

  // System resource monitoring
  private collectSystemMetrics(): void {
    // Memory usage
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.recordMetric({
        metricType: 'SYSTEM_RESOURCE',
        name: 'memory_usage',
        value: memInfo.usedJSHeapSize,
        unit: 'bytes',
        tags: { resource: 'memory' },
        threshold: { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 } // 50MB warning, 100MB critical
      });

      this.recordMetric({
        metricType: 'SYSTEM_RESOURCE',
        name: 'memory_limit',
        value: memInfo.jsHeapSizeLimit,
        unit: 'bytes',
        tags: { resource: 'memory_limit' }
      });
    }

    // Network timing
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric({
        metricType: 'SYSTEM_RESOURCE',
        name: 'network_speed',
        value: connection.downlink || 0,
        unit: 'mb',
        tags: { 
          resource: 'network',
          connectionType: connection.effectiveType || 'unknown'
        }
      });
    }

    // Performance timing for page loads
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      this.recordMetric({
        metricType: 'SYSTEM_RESOURCE',
        name: 'page_load_time',
        value: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
        unit: 'ms',
        tags: { resource: 'page_load' },
        threshold: { warning: 3000, critical: 8000 }
      });
    }

    // Local storage usage
    const localStorageSize = this.calculateLocalStorageSize();
    this.recordMetric({
      metricType: 'SYSTEM_RESOURCE',
      name: 'localstorage_usage',
      value: localStorageSize,
      unit: 'bytes',
      tags: { resource: 'storage' },
      threshold: { warning: 5 * 1024 * 1024, critical: 8 * 1024 * 1024 } // 5MB warning, 8MB critical
    });
  }

  private calculateLocalStorageSize(): number {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return totalSize;
  }

  // Performance analysis and trend detection
  private analyzePerformance(): void {
    const recentMetrics = this.getRecentMetrics(15); // Last 15 minutes
    
    // Analyze API response times
    const apiMetrics = recentMetrics.filter(m => m.metricType === 'API_RESPONSE');
    if (apiMetrics.length > 0) {
      const avgResponseTime = apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length;
      
      this.recordMetric({
        metricType: 'API_RESPONSE',
        name: 'average_api_response_time',
        value: avgResponseTime,
        unit: 'ms',
        tags: { analysis: 'trend' },
        threshold: { warning: 1500, critical: 3000 }
      });

      // Detect performance degradation
      if (avgResponseTime > 3000) {
        this.createPerformanceAlert('PERFORMANCE_DEGRADATION', 'HIGH',
          `API response times degraded: ${avgResponseTime.toFixed(0)}ms average`,
          ['api-performance']
        );
      }
    }

    // Analyze database performance
    const dbMetrics = this.databaseMetrics.filter(m => 
      (Date.now() - m.timestamp.getTime()) < 15 * 60 * 1000 // Last 15 minutes
    );
    
    if (dbMetrics.length > 0) {
      const avgQueryTime = dbMetrics.reduce((sum, m) => sum + m.executionTime, 0) / dbMetrics.length;
      const slowQueries = dbMetrics.filter(m => m.wasSlowQuery).length;
      
      this.recordMetric({
        metricType: 'DATABASE_QUERY',
        name: 'average_database_query_time',
        value: avgQueryTime,
        unit: 'ms',
        tags: { analysis: 'trend' },
        threshold: { warning: 500, critical: 1000 }
      });

      if (slowQueries > dbMetrics.length * 0.1) { // More than 10% slow queries
        this.createPerformanceAlert('SLOW_DATABASE', 'MEDIUM',
          `High slow query ratio: ${slowQueries}/${dbMetrics.length} queries`,
          ['database-performance']
        );
      }
    }

    // Analyze user activity patterns
    const userMetrics = this.userActivityMetrics.filter(m =>
      (Date.now() - m.timestamp.getTime()) < 60 * 60 * 1000 // Last hour
    );

    if (userMetrics.length > 0) {
      const errorRate = userMetrics.filter(m => !m.successful).length / userMetrics.length;
      
      if (errorRate > 0.05) { // More than 5% error rate
        this.createPerformanceAlert('API_ERRORS', 'MEDIUM',
          `High user action error rate: ${(errorRate * 100).toFixed(1)}%`,
          ['user-experience']
        );
      }
    }
  }

  // Health threshold monitoring
  private checkHealthThresholds(): void {
    const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
    
    recentMetrics.forEach(metric => {
      if (metric.threshold) {
        if (metric.value >= metric.threshold.critical) {
          this.createPerformanceAlert('PERFORMANCE_DEGRADATION', 'CRITICAL',
            `Critical threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`,
            [metric.name]
          );
        } else if (metric.value >= metric.threshold.warning) {
          this.createPerformanceAlert('PERFORMANCE_DEGRADATION', 'MEDIUM',
            `Warning threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`,
            [metric.name]
          );
        }
      }
    });
  }

  // Record performance metric
  private recordMetric(metricData: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const metric: PerformanceMetric = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...metricData
    };

    this.metrics.push(metric);
    
    // Keep only last 10,000 metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }

    this.saveMetrics();
  }

  private createPerformanceAlert(
    alertType: SystemHealthAlert['alertType'],
    severity: SystemHealthAlert['severity'],
    description: string,
    affectedServices: string[]
  ): void {
    // Check if similar alert already exists
    const existingAlert = this.systemAlerts.find(alert =>
      alert.alertType === alertType &&
      !alert.resolvedAt &&
      (Date.now() - alert.triggeredAt.getTime()) < 60 * 60 * 1000 // Last hour
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: SystemHealthAlert = {
      id: Date.now().toString(),
      alertType,
      severity,
      title: this.getAlertTitle(alertType),
      description,
      affectedServices,
      metrics: this.getRecentMetrics(5).filter(m => 
        affectedServices.some(service => 
          m.name.includes(service) || m.tags.endpoint?.includes(service)
        )
      ),
      triggeredAt: new Date(),
      autoResolved: false,
      notificationsSent: []
    };

    this.systemAlerts.push(alert);
    this.saveSystemAlerts();

    // Send notifications for critical alerts
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      this.sendPerformanceAlert(alert);
    }

    console.warn(`Performance alert: ${alertType} (${severity}) - ${description}`);
  }

  // Generate performance dashboard data
  public getPerformanceDashboard(): PerformanceDashboardData {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Overview metrics
    const recentApiMetrics = this.metrics.filter(m => 
      m.metricType === 'API_RESPONSE' && m.timestamp >= oneHourAgo
    );
    const averageResponseTime = recentApiMetrics.length > 0
      ? recentApiMetrics.reduce((sum, m) => sum + m.value, 0) / recentApiMetrics.length
      : 0;

    const recentUserMetrics = this.userActivityMetrics.filter(m => m.timestamp >= oneHourAgo);
    const errorRate = recentUserMetrics.length > 0
      ? recentUserMetrics.filter(m => !m.successful).length / recentUserMetrics.length
      : 0;

    // Purchase order specific metrics
    const purchaseOrderActions = recentUserMetrics.filter(m => 
      ['ORDER_CREATE', 'ORDER_UPDATE', 'APPROVAL_ACTION'].includes(m.action)
    );

    const orderCreationMetrics = purchaseOrderActions.filter(m => m.action === 'ORDER_CREATE');
    const averageOrderCreationTime = orderCreationMetrics.length > 0
      ? orderCreationMetrics.reduce((sum, m) => sum + m.duration, 0) / orderCreationMetrics.length
      : 0;

    // Database performance
    const recentDbMetrics = this.databaseMetrics.filter(m => m.timestamp >= oneHourAgo);
    const averageQueryTime = recentDbMetrics.length > 0
      ? recentDbMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentDbMetrics.length
      : 0;

    return {
      overview: {
        averageResponseTime,
        requestsPerSecond: this.calculateRequestsPerSecond(),
        errorRate: errorRate * 100,
        databaseConnectionPool: 85, // Mock data
        activeUsers: this.getActiveUsersCount(),
        systemUptime: this.getSystemUptime()
      },
      purchaseOrderMetrics: {
        ordersCreatedToday: this.getPurchaseOrdersCreatedToday(),
        averageOrderCreationTime,
        averageApprovalTime: this.getAverageApprovalTime(),
        averageSupplierResponseTime: this.getAverageSupplierResponseTime(),
        orderCompletionRate: this.getOrderCompletionRate(),
        criticalOrdersCount: this.getCriticalOrdersCount()
      },
      databasePerformance: {
        averageQueryTime,
        slowQueriesCount: recentDbMetrics.filter(m => m.wasSlowQuery).length,
        connectionPoolUsage: 75, // Mock data
        lockWaitTime: 12, // Mock data
        indexHitRatio: 98.5, // Mock data
        transactionsPerSecond: recentDbMetrics.length / 3600 // Per hour to per second
      },
      userActivity: {
        activeSessionsCount: this.getActiveSessionsCount(),
        averageSessionDuration: this.getAverageSessionDuration(),
        mostActiveUsers: this.getMostActiveUsers(),
        popularActions: this.getPopularActions(),
        errorsByUser: this.getErrorsByUser()
      },
      systemResources: {
        cpuUsage: this.getCPUUsage(),
        memoryUsage: this.getMemoryUsage(),
        diskUsage: 45, // Mock data
        networkThroughput: 15.7, // Mock data
        cacheHitRatio: 89.2 // Mock data
      },
      alerts: this.systemAlerts.filter(alert => !alert.resolvedAt).slice(0, 10)
    };
  }

  // Helper methods for dashboard calculations
  private calculateRequestsPerSecond(): number {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentRequests = this.metrics.filter(m => 
      m.metricType === 'API_RESPONSE' && m.timestamp >= oneMinuteAgo
    );
    return recentRequests.length / 60;
  }

  private getActiveUsersCount(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeUsers = new Set(
      this.userActivityMetrics
        .filter(m => m.timestamp >= oneHourAgo)
        .map(m => m.userId)
    );
    return activeUsers.size;
  }

  private getSystemUptime(): number {
    // Calculate uptime in hours (mock calculation)
    const startTime = localStorage.getItem('saleskik-system-start-time');
    if (startTime) {
      return Math.floor((Date.now() - parseInt(startTime)) / (1000 * 60 * 60));
    }
    
    // Set start time if not exists
    localStorage.setItem('saleskik-system-start-time', Date.now().toString());
    return 0;
  }

  private getPurchaseOrdersCreatedToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orderCreations = this.userActivityMetrics.filter(m => 
      m.action === 'ORDER_CREATE' && m.timestamp >= today && m.successful
    );
    
    return orderCreations.length;
  }

  private getAverageApprovalTime(): number {
    const approvalActions = this.userActivityMetrics.filter(m => 
      m.action === 'APPROVAL_ACTION' && m.successful
    );
    
    return approvalActions.length > 0
      ? approvalActions.reduce((sum, m) => sum + m.duration, 0) / approvalActions.length / 1000 / 60 // Convert to minutes
      : 0;
  }

  private getAverageSupplierResponseTime(): number {
    // Calculate from purchase order data
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const confirmedOrders = orders.filter((order: any) => order.supplierConfirmedDate);
    
    if (confirmedOrders.length === 0) return 0;
    
    const responseTimes = confirmedOrders.map((order: any) => {
      const sentDate = new Date(order.updatedAt);
      const confirmedDate = new Date(order.supplierConfirmedDate);
      return (confirmedDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60); // Hours
    });
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private getOrderCompletionRate(): number {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order: any) => order.status === 'COMPLETED').length;
    
    return totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  }

  private getCriticalOrdersCount(): number {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    return orders.filter((order: any) => 
      order.priorityLevel === 'URGENT' || 
      order.status === 'CONFIRMATION_OVERDUE' ||
      order.dispatchBlocked
    ).length;
  }

  // Resource usage calculations
  private getCPUUsage(): number {
    // Estimate CPU usage based on recent activity
    const recentActivity = this.getRecentMetrics(5).length;
    return Math.min(100, (recentActivity / 50) * 100); // Mock calculation
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  // Utility methods
  private extractQueryType(query: string): DatabaseQueryMetric['queryType'] {
    const upperQuery = query.trim().toUpperCase();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    return 'SELECT';
  }

  private extractIndexUsage(query: string, tableName: string): string[] {
    // Simplified index detection (in production, use EXPLAIN ANALYZE)
    const indexes = [];
    if (query.includes('WHERE')) indexes.push(`${tableName}_where_index`);
    if (query.includes('ORDER BY')) indexes.push(`${tableName}_order_index`);
    if (query.includes('JOIN')) indexes.push(`${tableName}_join_index`);
    return indexes;
  }

  private categorizeEndpoint(endpoint: string): string {
    if (endpoint.includes('/purchase-orders')) return 'purchase-orders';
    if (endpoint.includes('/suppliers')) return 'suppliers';
    if (endpoint.includes('/auth')) return 'authentication';
    if (endpoint.includes('/upload')) return 'file-upload';
    return 'general';
  }

  private getAlertTitle(alertType: SystemHealthAlert['alertType']): string {
    const titles = {
      'PERFORMANCE_DEGRADATION': 'Performance Degradation Detected',
      'HIGH_RESOURCE_USAGE': 'High Resource Usage Alert',
      'SLOW_DATABASE': 'Database Performance Issue',
      'API_ERRORS': 'API Error Rate Alert',
      'WEBSOCKET_ISSUES': 'WebSocket Connection Issues',
      'EXTERNAL_SERVICE_DOWN': 'External Service Unavailable'
    };
    return titles[alertType] || 'System Performance Alert';
  }

  private sendPerformanceAlert(alert: SystemHealthAlert): void {
    // Send to monitoring team
    console.error('PERFORMANCE ALERT:', {
      type: alert.alertType,
      severity: alert.severity,
      description: alert.description,
      services: alert.affectedServices
    });

    // In production, send to monitoring service or email
    alert.notificationsSent.push('monitoring-team@eccohardware.com.au');
  }

  // Helper methods for user context
  private getCurrentUserId(): string {
    return 'current-user'; // In production, get from auth context
  }

  private getCurrentUserName(): string {
    return 'Current User'; // In production, get from auth context
  }

  private getCurrentUserRole(): string {
    return 'ADMIN'; // In production, get from auth context
  }

  private getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  private getCurrentIPAddress(): string {
    return '192.168.1.100'; // In production, get real client IP
  }

  private getRecentMetrics(minutes: number): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  // Storage methods
  private saveMetrics(): void {
    localStorage.setItem('saleskik-performance-metrics', JSON.stringify(this.metrics));
  }

  private saveDatabaseMetrics(): void {
    localStorage.setItem('saleskik-database-metrics', JSON.stringify(this.databaseMetrics));
  }

  private saveUserActivityMetrics(): void {
    localStorage.setItem('saleskik-user-activity-metrics', JSON.stringify(this.userActivityMetrics));
  }

  private saveSystemAlerts(): void {
    localStorage.setItem('saleskik-system-alerts', JSON.stringify(this.systemAlerts));
  }

  // Public API methods
  public startMonitoring(): void {
    console.log('Performance monitoring started for purchase order system');
    
    // Track initial page load
    this.trackUserActivity({
      action: 'PAGE_VIEW',
      duration: performance.now(),
      successful: true,
      pageUrl: window.location.href
    });
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Performance monitoring stopped');
  }

  public getMetricsByType(metricType: PerformanceMetric['metricType']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.metricType === metricType);
  }

  public getSystemAlerts(severity?: SystemHealthAlert['severity']): SystemHealthAlert[] {
    let filtered = [...this.systemAlerts];
    
    if (severity) {
      filtered = filtered.filter(alert => alert.severity === severity);
    }
    
    return filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  public resolveAlert(alertId: string, resolution: string): boolean {
    const alert = this.systemAlerts.find(a => a.id === alertId);
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date();
      alert.resolution = resolution;
      this.saveSystemAlerts();
      return true;
    }
    return false;
  }

  // Additional helper methods for dashboard
  private getActiveSessionsCount(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeSessions = new Set(
      this.userActivityMetrics
        .filter(m => m.timestamp >= oneHourAgo)
        .map(m => m.sessionId)
    );
    return activeSessions.size;
  }

  private getAverageSessionDuration(): number {
    // Mock calculation - would be calculated from session start/end events
    return 45; // 45 minutes average
  }

  private getMostActiveUsers(): Array<{ userId: string; actionCount: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const userActions = new Map<string, number>();
    
    this.userActivityMetrics
      .filter(m => m.timestamp >= oneHourAgo)
      .forEach(m => {
        userActions.set(m.userId, (userActions.get(m.userId) || 0) + 1);
      });

    return Array.from(userActions.entries())
      .map(([userId, actionCount]) => ({ userId, actionCount }))
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 5);
  }

  private getPopularActions(): Array<{ action: string; count: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const actionCounts = new Map<string, number>();
    
    this.userActivityMetrics
      .filter(m => m.timestamp >= oneHourAgo)
      .forEach(m => {
        actionCounts.set(m.action, (actionCounts.get(m.action) || 0) + 1);
      });

    return Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getErrorsByUser(): Array<{ userId: string; errorCount: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const userErrors = new Map<string, number>();
    
    this.userActivityMetrics
      .filter(m => m.timestamp >= oneHourAgo && !m.successful)
      .forEach(m => {
        userErrors.set(m.userId, (userErrors.get(m.userId) || 0) + 1);
      });

    return Array.from(userErrors.entries())
      .map(([userId, errorCount]) => ({ userId, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);
  }
}

export default PerformanceMonitoringService;