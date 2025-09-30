// Role-Based Access Control for Purchase Order System
// Enforces permissions based on user roles and business rules

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'WAREHOUSE_STAFF' | 'ACCOUNTING';

export type PurchaseOrderPermission = 
  | 'CREATE_PURCHASE_ORDER'
  | 'EDIT_PURCHASE_ORDER'
  | 'DELETE_PURCHASE_ORDER'
  | 'APPROVE_PURCHASE_ORDER'
  | 'SEND_TO_SUPPLIER'
  | 'CONFIRM_RECEIPT'
  | 'CREATE_INVOICE'
  | 'APPROVE_INVOICE'
  | 'VIEW_FINANCIAL_DATA'
  | 'MANAGE_SUPPLIERS'
  | 'CONFIGURE_WORKFLOWS'
  | 'VIEW_ANALYTICS'
  | 'EXPORT_DATA'
  | 'EMERGENCY_OVERRIDE';

interface PermissionMatrix {
  [role: string]: {
    permissions: PurchaseOrderPermission[];
    restrictions: {
      maxOrderValue?: number;
      allowedSuppliers?: string[];
      allowedStatuses?: string[];
      requiresApproval?: boolean;
    };
  };
}

interface PermissionContext {
  userId: string;
  userRole: UserRole;
  purchaseOrder?: any;
  requestedAction: string;
  additionalData?: any;
}

interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  escalationRequired?: boolean;
  additionalValidation?: string[];
}

class PurchaseOrderPermissionService {
  private static instance: PurchaseOrderPermissionService;
  
  private permissionMatrix: PermissionMatrix = {
    ADMIN: {
      permissions: [
        'CREATE_PURCHASE_ORDER',
        'EDIT_PURCHASE_ORDER',
        'DELETE_PURCHASE_ORDER',
        'APPROVE_PURCHASE_ORDER',
        'SEND_TO_SUPPLIER',
        'CONFIRM_RECEIPT',
        'CREATE_INVOICE',
        'APPROVE_INVOICE',
        'VIEW_FINANCIAL_DATA',
        'MANAGE_SUPPLIERS',
        'CONFIGURE_WORKFLOWS',
        'VIEW_ANALYTICS',
        'EXPORT_DATA',
        'EMERGENCY_OVERRIDE'
      ],
      restrictions: {}
    },
    MANAGER: {
      permissions: [
        'CREATE_PURCHASE_ORDER',
        'EDIT_PURCHASE_ORDER',
        'APPROVE_PURCHASE_ORDER',
        'SEND_TO_SUPPLIER',
        'CONFIRM_RECEIPT',
        'APPROVE_INVOICE',
        'VIEW_FINANCIAL_DATA',
        'VIEW_ANALYTICS',
        'EXPORT_DATA'
      ],
      restrictions: {
        maxOrderValue: 50000 // $50,000 limit
      }
    },
    EMPLOYEE: {
      permissions: [
        'CREATE_PURCHASE_ORDER',
        'EDIT_PURCHASE_ORDER',
        'VIEW_FINANCIAL_DATA'
      ],
      restrictions: {
        maxOrderValue: 5000, // $5,000 limit
        requiresApproval: true
      }
    },
    WAREHOUSE_STAFF: {
      permissions: [
        'CONFIRM_RECEIPT',
        'VIEW_FINANCIAL_DATA'
      ],
      restrictions: {
        allowedStatuses: ['SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED']
      }
    },
    ACCOUNTING: {
      permissions: [
        'CREATE_INVOICE',
        'APPROVE_INVOICE',
        'VIEW_FINANCIAL_DATA',
        'VIEW_ANALYTICS',
        'EXPORT_DATA'
      ],
      restrictions: {
        allowedStatuses: ['FULLY_RECEIVED', 'INVOICED']
      }
    }
  };

  private constructor() {}

  public static getInstance(): PurchaseOrderPermissionService {
    if (!PurchaseOrderPermissionService.instance) {
      PurchaseOrderPermissionService.instance = new PurchaseOrderPermissionService();
    }
    return PurchaseOrderPermissionService.instance;
  }

  // Main permission check method
  public checkPermission(context: PermissionContext): PermissionResult {
    const userPermissions = this.permissionMatrix[context.userRole];
    
    if (!userPermissions) {
      return {
        allowed: false,
        reason: 'Invalid user role'
      };
    }

    // Map actions to required permissions
    const requiredPermission = this.mapActionToPermission(context.requestedAction);
    
    if (!requiredPermission) {
      return {
        allowed: false,
        reason: 'Invalid action specified'
      };
    }

    // Check if user has required permission
    if (!userPermissions.permissions.includes(requiredPermission)) {
      return {
        allowed: false,
        reason: `${context.userRole} role does not have ${requiredPermission} permission`
      };
    }

    // Apply role-specific restrictions
    const restrictionCheck = this.checkRestrictions(context, userPermissions.restrictions);
    if (!restrictionCheck.allowed) {
      return restrictionCheck;
    }

    // Check business rule restrictions
    const businessRuleCheck = this.checkBusinessRules(context);
    if (!businessRuleCheck.allowed) {
      return businessRuleCheck;
    }

    return {
      allowed: true,
      requiresApproval: userPermissions.restrictions.requiresApproval,
      escalationRequired: context.purchaseOrder?.priorityLevel === 'URGENT' && context.userRole === 'EMPLOYEE'
    };
  }

  private mapActionToPermission(action: string): PurchaseOrderPermission | null {
    const actionMap: { [key: string]: PurchaseOrderPermission } = {
      'create': 'CREATE_PURCHASE_ORDER',
      'edit': 'EDIT_PURCHASE_ORDER',
      'delete': 'DELETE_PURCHASE_ORDER',
      'approve': 'APPROVE_PURCHASE_ORDER',
      'send_to_supplier': 'SEND_TO_SUPPLIER',
      'confirm_receipt': 'CONFIRM_RECEIPT',
      'create_invoice': 'CREATE_INVOICE',
      'approve_invoice': 'APPROVE_INVOICE',
      'view_financial': 'VIEW_FINANCIAL_DATA',
      'manage_suppliers': 'MANAGE_SUPPLIERS',
      'configure_workflows': 'CONFIGURE_WORKFLOWS',
      'view_analytics': 'VIEW_ANALYTICS',
      'export_data': 'EXPORT_DATA',
      'emergency_override': 'EMERGENCY_OVERRIDE'
    };

    return actionMap[action] || null;
  }

  private checkRestrictions(context: PermissionContext, restrictions: any): PermissionResult {
    // Check order value restrictions
    if (restrictions.maxOrderValue && context.purchaseOrder) {
      if (context.purchaseOrder.totalAmount > restrictions.maxOrderValue) {
        return {
          allowed: false,
          reason: `Order value $${context.purchaseOrder.totalAmount} exceeds role limit of $${restrictions.maxOrderValue}`,
          escalationRequired: true
        };
      }
    }

    // Check supplier restrictions
    if (restrictions.allowedSuppliers && context.purchaseOrder) {
      if (!restrictions.allowedSuppliers.includes(context.purchaseOrder.supplier.id)) {
        return {
          allowed: false,
          reason: 'User not authorized for this supplier'
        };
      }
    }

    // Check status restrictions
    if (restrictions.allowedStatuses && context.purchaseOrder) {
      if (!restrictions.allowedStatuses.includes(context.purchaseOrder.status)) {
        return {
          allowed: false,
          reason: `Action not allowed for order status: ${context.purchaseOrder.status}`
        };
      }
    }

    return { allowed: true };
  }

  private checkBusinessRules(context: PermissionContext): PermissionResult {
    if (!context.purchaseOrder) {
      return { allowed: true };
    }

    const order = context.purchaseOrder;

    // Critical business rules
    switch (context.requestedAction) {
      case 'approve':
        if (order.totalAmount > 10000 && context.userRole !== 'ADMIN') {
          return {
            allowed: false,
            reason: 'Orders over $10,000 require ADMIN approval',
            escalationRequired: true
          };
        }
        break;

      case 'send_to_supplier':
        if (order.status !== 'APPROVED') {
          return {
            allowed: false,
            reason: 'Order must be approved before sending to supplier'
          };
        }
        break;

      case 'confirm_receipt':
        if (!['SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)) {
          return {
            allowed: false,
            reason: 'Order must be supplier confirmed before receipt confirmation'
          };
        }
        break;

      case 'create_invoice':
        if (order.status !== 'FULLY_RECEIVED') {
          return {
            allowed: false,
            reason: 'All items must be received before invoice creation'
          };
        }
        break;

      case 'edit':
        if (['COMPLETED', 'CANCELLED', 'INVOICED'].includes(order.status)) {
          return {
            allowed: false,
            reason: 'Cannot edit orders in final states'
          };
        }
        break;

      case 'delete':
        if (order.status !== 'DRAFT') {
          return {
            allowed: false,
            reason: 'Can only delete draft orders'
          };
        }
        break;
    }

    // Custom glass business rules
    if (order.lineItems?.some((item: any) => item.customModuleFlag)) {
      if (context.requestedAction === 'approve' && !order.supplier.isLocalGlassSupplier) {
        return {
          allowed: true,
          reason: 'Custom glass order should use glass specialist supplier',
          additionalValidation: ['Confirm supplier can handle custom glass requirements']
        };
      }
    }

    return { allowed: true };
  }

  // Get user's effective permissions for UI display
  public getUserPermissions(userRole: UserRole): {
    permissions: PurchaseOrderPermission[];
    restrictions: any;
    canCreateOrders: boolean;
    canApproveOrders: boolean;
    maxOrderValue?: number;
  } {
    const userPermissions = this.permissionMatrix[userRole];
    
    if (!userPermissions) {
      return {
        permissions: [],
        restrictions: {},
        canCreateOrders: false,
        canApproveOrders: false
      };
    }

    return {
      permissions: userPermissions.permissions,
      restrictions: userPermissions.restrictions,
      canCreateOrders: userPermissions.permissions.includes('CREATE_PURCHASE_ORDER'),
      canApproveOrders: userPermissions.permissions.includes('APPROVE_PURCHASE_ORDER'),
      maxOrderValue: userPermissions.restrictions.maxOrderValue
    };
  }

  // Check if action buttons should be shown in UI
  public shouldShowActionButton(action: string, userRole: UserRole, purchaseOrder?: any): boolean {
    const context: PermissionContext = {
      userId: 'current-user',
      userRole,
      purchaseOrder,
      requestedAction: action
    };

    const result = this.checkPermission(context);
    return result.allowed;
  }

  // Get filtered purchase orders based on user permissions
  public filterPurchaseOrdersForUser(orders: any[], userRole: UserRole): any[] {
    const userPermissions = this.permissionMatrix[userRole];
    
    if (!userPermissions) return [];

    // ADMIN and MANAGER see all orders
    if (['ADMIN', 'MANAGER'].includes(userRole)) {
      return orders;
    }

    // EMPLOYEE sees only their created orders and orders requiring their action
    if (userRole === 'EMPLOYEE') {
      return orders.filter(order => 
        order.createdBy === 'current-user' || // Their orders
        (order.status === 'DRAFT' && order.createdBy === 'current-user') // Their drafts
      );
    }

    // WAREHOUSE_STAFF sees only orders ready for receipt
    if (userRole === 'WAREHOUSE_STAFF') {
      return orders.filter(order => 
        ['SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)
      );
    }

    // ACCOUNTING sees only orders ready for invoicing
    if (userRole === 'ACCOUNTING') {
      return orders.filter(order => 
        ['FULLY_RECEIVED', 'INVOICED'].includes(order.status)
      );
    }

    return [];
  }

  // Audit permission checks
  public logPermissionCheck(context: PermissionContext, result: PermissionResult): void {
    const auditLog = {
      id: Date.now().toString(),
      userId: context.userId,
      userRole: context.userRole,
      requestedAction: context.requestedAction,
      purchaseOrderId: context.purchaseOrder?.id,
      allowed: result.allowed,
      reason: result.reason,
      timestamp: new Date(),
      ipAddress: 'client-ip', // Replace with actual IP
      userAgent: navigator.userAgent
    };

    const existingLogs = JSON.parse(localStorage.getItem('saleskik-permission-audit-logs') || '[]');
    existingLogs.push(auditLog);
    
    // Keep only last 1000 logs to prevent storage bloat
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem('saleskik-permission-audit-logs', JSON.stringify(existingLogs));

    if (!result.allowed) {
      console.warn('Permission denied:', auditLog);
    }
  }

  // Emergency override functionality
  public requestEmergencyOverride(
    userId: string,
    userRole: UserRole,
    purchaseOrderId: string,
    action: string,
    justification: string
  ): { approved: boolean; overrideToken?: string } {
    // Only ADMIN can grant emergency overrides
    if (userRole !== 'ADMIN') {
      return { approved: false };
    }

    const overrideToken = this.generateOverrideToken();
    
    const override = {
      id: Date.now().toString(),
      userId,
      userRole,
      purchaseOrderId,
      action,
      justification,
      overrideToken,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      used: false
    };

    const existingOverrides = JSON.parse(localStorage.getItem('saleskik-emergency-overrides') || '[]');
    existingOverrides.push(override);
    localStorage.setItem('saleskik-emergency-overrides', JSON.stringify(existingOverrides));

    console.log('Emergency override granted:', override);
    return { approved: true, overrideToken };
  }

  public validateEmergencyOverride(overrideToken: string): boolean {
    const overrides = JSON.parse(localStorage.getItem('saleskik-emergency-overrides') || '[]');
    const override = overrides.find((o: any) => o.overrideToken === overrideToken);

    if (!override || override.used) {
      return false;
    }

    // Check expiry
    if (new Date() > new Date(override.expiresAt)) {
      return false;
    }

    // Mark as used
    override.used = true;
    localStorage.setItem('saleskik-emergency-overrides', JSON.stringify(overrides));

    return true;
  }

  private generateOverrideToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Get user's current role from session
  public getCurrentUserRole(): UserRole {
    try {
      const employeeSession = localStorage.getItem('employee-session');
      if (employeeSession) {
        const employee = JSON.parse(employeeSession);
        return employee.role || 'EMPLOYEE';
      }
      
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken && !accessToken.startsWith('employee-token-')) {
        return 'ADMIN'; // Regular admin login
      }
      
      return 'EMPLOYEE'; // Default to most restrictive
    } catch (error) {
      console.error('Role detection error:', error);
      return 'EMPLOYEE'; // Safe fallback
    }
  }

  // Check if user can perform action on specific order
  public canPerformAction(action: string, purchaseOrder?: any, userRole?: UserRole): PermissionResult {
    const role = userRole || this.getCurrentUserRole();
    
    const context: PermissionContext = {
      userId: 'current-user',
      userRole: role,
      purchaseOrder,
      requestedAction: action
    };

    const result = this.checkPermission(context);
    this.logPermissionCheck(context, result);
    
    return result;
  }

  // Get permission-filtered actions for UI
  public getAvailableActions(purchaseOrder: any, userRole?: UserRole): {
    action: string;
    label: string;
    icon: string;
    variant: 'primary' | 'secondary' | 'danger';
    requiresConfirmation?: boolean;
  }[] {
    const role = userRole || this.getCurrentUserRole();
    const availableActions = [];

    // Define all possible actions
    const allActions = [
      { action: 'edit', label: 'Edit Order', icon: 'PencilIcon', variant: 'secondary' as const },
      { action: 'approve', label: 'Approve', icon: 'CheckCircleIcon', variant: 'primary' as const },
      { action: 'send_to_supplier', label: 'Send to Supplier', icon: 'PaperAirplaneIcon', variant: 'primary' as const },
      { action: 'confirm_receipt', label: 'Confirm Receipt', icon: 'TruckIcon', variant: 'primary' as const },
      { action: 'create_invoice', label: 'Create Invoice', icon: 'DocumentTextIcon', variant: 'primary' as const },
      { action: 'cancel', label: 'Cancel Order', icon: 'XMarkIcon', variant: 'danger' as const, requiresConfirmation: true },
      { action: 'delete', label: 'Delete', icon: 'TrashIcon', variant: 'danger' as const, requiresConfirmation: true }
    ];

    // Filter based on permissions and order status
    return allActions.filter(actionDef => {
      const permissionResult = this.canPerformAction(actionDef.action, purchaseOrder, role);
      return permissionResult.allowed;
    });
  }

  // Security helpers
  public validateSecureAction(
    action: string,
    purchaseOrder: any,
    userRole: UserRole,
    securityToken?: string
  ): { valid: boolean; reason?: string } {
    // High-security actions require additional validation
    const highSecurityActions = ['delete', 'emergency_override', 'approve_invoice'];
    
    if (highSecurityActions.includes(action)) {
      if (!securityToken) {
        return {
          valid: false,
          reason: 'Security token required for this action'
        };
      }

      // Validate security token (in production, this would check against secure storage)
      if (!this.validateSecurityToken(securityToken, action)) {
        return {
          valid: false,
          reason: 'Invalid or expired security token'
        };
      }
    }

    return { valid: true };
  }

  private validateSecurityToken(token: string, action: string): boolean {
    // In production, validate against secure token storage
    // For demo, accept any token longer than 10 characters
    return token.length > 10;
  }

  // Get permission summary for dashboard
  public getPermissionSummary(userRole?: UserRole): {
    role: UserRole;
    canCreate: boolean;
    canApprove: boolean;
    canManageSuppliers: boolean;
    canViewAnalytics: boolean;
    maxOrderValue?: number;
    restrictions: string[];
  } {
    const role = userRole || this.getCurrentUserRole();
    const userPermissions = this.permissionMatrix[role];

    if (!userPermissions) {
      return {
        role,
        canCreate: false,
        canApprove: false,
        canManageSuppliers: false,
        canViewAnalytics: false,
        restrictions: ['Invalid role']
      };
    }

    const restrictions = [];
    if (userPermissions.restrictions.maxOrderValue) {
      restrictions.push(`Max order value: $${userPermissions.restrictions.maxOrderValue.toLocaleString()}`);
    }
    if (userPermissions.restrictions.allowedStatuses) {
      restrictions.push(`Limited to statuses: ${userPermissions.restrictions.allowedStatuses.join(', ')}`);
    }
    if (userPermissions.restrictions.requiresApproval) {
      restrictions.push('All orders require approval');
    }

    return {
      role,
      canCreate: userPermissions.permissions.includes('CREATE_PURCHASE_ORDER'),
      canApprove: userPermissions.permissions.includes('APPROVE_PURCHASE_ORDER'),
      canManageSuppliers: userPermissions.permissions.includes('MANAGE_SUPPLIERS'),
      canViewAnalytics: userPermissions.permissions.includes('VIEW_ANALYTICS'),
      maxOrderValue: userPermissions.restrictions.maxOrderValue,
      restrictions
    };
  }

  // Data access control
  public filterSensitiveData(data: any, userRole: UserRole): any {
    const role = userRole || this.getCurrentUserRole();
    
    // Remove sensitive financial data for non-authorized roles
    if (!this.permissionMatrix[role]?.permissions.includes('VIEW_FINANCIAL_DATA')) {
      const sanitized = { ...data };
      delete sanitized.totalAmount;
      delete sanitized.lineItems;
      delete sanitized.internalNotes;
      return sanitized;
    }

    return data;
  }

  // Batch permission check for multiple orders
  public checkBatchPermissions(
    action: string,
    orders: any[],
    userRole?: UserRole
  ): { allowedOrders: string[]; deniedOrders: { id: string; reason: string }[] } {
    const role = userRole || this.getCurrentUserRole();
    const allowedOrders: string[] = [];
    const deniedOrders: { id: string; reason: string }[] = [];

    orders.forEach(order => {
      const result = this.canPerformAction(action, order, role);
      if (result.allowed) {
        allowedOrders.push(order.id);
      } else {
        deniedOrders.push({
          id: order.id,
          reason: result.reason || 'Permission denied'
        });
      }
    });

    return { allowedOrders, deniedOrders };
  }
}

export default PurchaseOrderPermissionService;