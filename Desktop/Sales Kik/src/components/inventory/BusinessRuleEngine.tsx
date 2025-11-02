import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, ShieldExclamationIcon, DocumentTextIcon,
  CheckCircleIcon, XMarkIcon, ClockIcon, BanknotesIcon,
  TruckIcon, InformationCircleIcon, LockClosedIcon,
  ClipboardDocumentCheckIcon, ArrowPathIcon, EyeIcon,
  ShieldCheckIcon, CogIcon
} from '@heroicons/react/24/outline';

// Business Rule Interfaces
interface BusinessRule {
  id: string;
  name: string;
  description: string;
  type: 'DISPATCH_BLOCKING' | 'APPROVAL_REQUIRED' | 'VALIDATION' | 'NOTIFICATION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isActive: boolean;
  conditions: {
    field: string;
    operator: string;
    value: any;
  }[];
}

interface PurchaseOrderValidation {
  orderId: string;
  purchaseOrderNumber: string;
  violations: {
    ruleId: string;
    ruleName: string;
    severity: string;
    message: string;
    blockingAction: boolean;
  }[];
  canDispatch: boolean;
  canComplete: boolean;
  warningCount: number;
  errorCount: number;
}

interface BusinessRuleEngineProps {
  purchaseOrders: any[];
  onRuleViolation: (orderId: string, violations: any[]) => void;
}

export default function BusinessRuleEngine({ purchaseOrders, onRuleViolation }: BusinessRuleEngineProps) {
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  const [violations, setViolations] = useState<PurchaseOrderValidation[]>([]);
  const [showRulesDashboard, setShowRulesDashboard] = useState(false);

  useEffect(() => {
    initializeBusinessRules();
  }, []);

  useEffect(() => {
    if (businessRules.length > 0) {
      validateAllOrders();
    }
  }, [purchaseOrders, businessRules]);

  const initializeBusinessRules = () => {
    const defaultRules: BusinessRule[] = [
      {
        id: 'dispatch-invoice-required',
        name: 'Invoice Required Before Dispatch',
        description: 'Cannot dispatch goods without invoice creation',
        type: 'DISPATCH_BLOCKING',
        severity: 'CRITICAL',
        isActive: true,
        conditions: [
          { field: 'invoiceRequired', operator: 'equals', value: true },
          { field: 'invoiceCreated', operator: 'equals', value: false },
          { field: 'status', operator: 'in', value: ['FULLY_RECEIVED', 'INVOICED'] }
        ]
      },
      {
        id: 'completion-documentation-required',
        name: 'Documentation Required for Completion',
        description: 'Cannot mark order as completed without proper documentation',
        type: 'DISPATCH_BLOCKING',
        severity: 'CRITICAL',
        isActive: true,
        conditions: [
          { field: 'invoiceCreated', operator: 'equals', value: false },
          { field: 'status', operator: 'equals', value: 'FULLY_RECEIVED' }
        ]
      },
      {
        id: 'high-value-approval',
        name: 'High Value Order Approval',
        description: 'Orders over $5,000 require manager approval',
        type: 'APPROVAL_REQUIRED',
        severity: 'HIGH',
        isActive: true,
        conditions: [
          { field: 'totalAmount', operator: 'greater_than', value: 5000 },
          { field: 'approvalRequired', operator: 'equals', value: true },
          { field: 'approvedBy', operator: 'is_null', value: null }
        ]
      },
      {
        id: 'custom-glass-specialist-recommended',
        name: 'Custom Glass Specialist Recommended',
        description: 'Custom glass orders should use glass specialist suppliers',
        type: 'VALIDATION',
        severity: 'MEDIUM',
        isActive: true,
        conditions: [
          { field: 'hasCustomGlass', operator: 'equals', value: true },
          { field: 'supplier.isLocalGlassSupplier', operator: 'equals', value: false }
        ]
      },
      {
        id: 'urgent-order-escalation',
        name: 'Urgent Order Escalation',
        description: 'Urgent orders require immediate attention',
        type: 'NOTIFICATION',
        severity: 'HIGH',
        isActive: true,
        conditions: [
          { field: 'priorityLevel', operator: 'equals', value: 'URGENT' },
          { field: 'status', operator: 'in', value: ['DRAFT', 'PENDING_APPROVAL'] }
        ]
      },
      {
        id: 'supplier-confirmation-timeout',
        name: 'Supplier Confirmation Timeout',
        description: 'Supplier has not confirmed order within 48 hours',
        type: 'NOTIFICATION',
        severity: 'MEDIUM',
        isActive: true,
        conditions: [
          { field: 'status', operator: 'equals', value: 'SENT_TO_SUPPLIER' },
          { field: 'hoursWithoutConfirmation', operator: 'greater_than', value: 48 }
        ]
      }
    ];

    setBusinessRules(defaultRules);
    localStorage.setItem('saleskik-business-rules', JSON.stringify(defaultRules));
  };

  const evaluateRule = (rule: BusinessRule, order: any): boolean => {
    if (!rule.isActive) return false;

    return rule.conditions.every(condition => {
      const fieldValue = getNestedValue(order, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return parseFloat(fieldValue) > condition.value;
        case 'less_than':
          return parseFloat(fieldValue) < condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'is_null':
          return fieldValue === null || fieldValue === undefined;
        case 'is_not_null':
          return fieldValue !== null && fieldValue !== undefined;
        default:
          return false;
      }
    });
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      if (key === 'hasCustomGlass') {
        return obj.lineItems?.some((item: any) => item.customModuleFlag) || false;
      }
      if (key === 'hoursWithoutConfirmation') {
        if (obj.status === 'SENT_TO_SUPPLIER' && !obj.supplierConfirmedDate) {
          const sentDate = new Date(obj.updatedAt);
          const now = new Date();
          return (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60);
        }
        return 0;
      }
      return current?.[key];
    }, obj);
  };

  const validateAllOrders = () => {
    const validationResults: PurchaseOrderValidation[] = [];

    purchaseOrders.forEach(order => {
      const orderViolations: any[] = [];
      let canDispatch = true;
      let canComplete = true;

      businessRules.forEach(rule => {
        if (evaluateRule(rule, order)) {
          const violation = {
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: rule.description,
            blockingAction: rule.type === 'DISPATCH_BLOCKING'
          };

          orderViolations.push(violation);

          if (rule.type === 'DISPATCH_BLOCKING') {
            if (rule.id === 'dispatch-invoice-required') {
              canDispatch = false;
            }
            if (rule.id === 'completion-documentation-required') {
              canComplete = false;
            }
          }
        }
      });

      const validation: PurchaseOrderValidation = {
        orderId: order.id,
        purchaseOrderNumber: order.purchaseOrderNumber,
        violations: orderViolations,
        canDispatch,
        canComplete,
        warningCount: orderViolations.filter(v => v.severity === 'MEDIUM' || v.severity === 'LOW').length,
        errorCount: orderViolations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length
      };

      validationResults.push(validation);

      if (orderViolations.length > 0) {
        onRuleViolation(order.id, orderViolations);
      }
    });

    setViolations(validationResults);
  };

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViolationIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <ShieldExclamationIcon className="w-5 h-5 text-red-600" />;
      case 'HIGH': return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      case 'MEDIUM': return <InformationCircleIcon className="w-5 h-5 text-yellow-600" />;
      case 'LOW': return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const criticalViolations = violations.filter(v => 
    v.violations.some(violation => violation.severity === 'CRITICAL' && violation.blockingAction)
  );

  return (
    <div className="space-y-4">
      
      {/* Critical Violations Alert */}
      {criticalViolations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500 rounded-lg">
              <ShieldExclamationIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900">DISPATCH BLOCKED</h3>
              <p className="text-sm text-red-700">
                {criticalViolations.length} order{criticalViolations.length !== 1 ? 's' : ''} blocked from dispatch due to business rule violations
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {criticalViolations.slice(0, 3).map(validation => (
              <div key={validation.orderId} className="bg-white border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{validation.purchaseOrderNumber}</div>
                  <div className="flex items-center gap-1">
                    <LockClosedIcon className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">BLOCKED</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {validation.violations
                    .filter(v => v.severity === 'CRITICAL' && v.blockingAction)
                    .map((violation, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {violation.message}
                      </div>
                    ))}
                </div>
              </div>
            ))}
            
            {criticalViolations.length > 3 && (
              <button
                onClick={() => setShowRulesDashboard(true)}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                View all {criticalViolations.length} blocked orders
              </button>
            )}
          </div>
        </div>
      )}

      {/* Business Rules Dashboard */}
      {showRulesDashboard && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-600 rounded-lg">
                  <ShieldExclamationIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Business Rule Enforcement Center</h3>
                  <p className="text-gray-600">
                    {violations.filter(v => v.errorCount > 0).length} order{violations.filter(v => v.errorCount > 0).length !== 1 ? 's' : ''} with violations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesDashboard(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96">
              
              {/* Rule Violations List */}
              <div className="p-6 space-y-4">
                
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {violations.filter(v => !v.canDispatch).length}
                    </div>
                    <div className="text-sm text-red-700">Dispatch Blocked</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {violations.filter(v => !v.canComplete).length}
                    </div>
                    <div className="text-sm text-orange-700">Completion Blocked</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {violations.reduce((sum, v) => sum + v.warningCount, 0)}
                    </div>
                    <div className="text-sm text-yellow-700">Total Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {violations.reduce((sum, v) => sum + v.errorCount, 0)}
                    </div>
                    <div className="text-sm text-red-700">Critical Errors</div>
                  </div>
                </div>

                {/* Violation Details */}
                {violations.filter(v => v.violations.length > 0).map(validation => (
                  <div key={validation.orderId} className="border border-gray-200 rounded-lg overflow-hidden">
                    
                    {/* Order Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{validation.purchaseOrderNumber}</div>
                        <div className="flex items-center gap-2">
                          {!validation.canDispatch && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              DISPATCH BLOCKED
                            </span>
                          )}
                          {!validation.canComplete && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              COMPLETION BLOCKED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Violations List */}
                    <div className="p-4 space-y-3">
                      {validation.violations.map((violation, index) => (
                        <div key={index} className={`flex items-start gap-3 p-3 border rounded-lg ${getViolationColor(violation.severity)}`}>
                          {getViolationIcon(violation.severity)}
                          <div className="flex-1">
                            <div className="font-medium">{violation.ruleName}</div>
                            <div className="text-sm mt-1">{violation.message}</div>
                            {violation.blockingAction && (
                              <div className="text-xs mt-2 font-medium">
                                This violation prevents order dispatch/completion
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Active Rules Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Active Business Rules</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businessRules.filter(rule => rule.isActive).map(rule => (
                      <div key={rule.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{rule.name}</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rule.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            rule.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            rule.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{rule.description}</div>
                        <div className="text-xs text-gray-500 mt-2">Type: {rule.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Rule Status Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Business Rules Engine</div>
              <div className="text-sm text-gray-600">
                {businessRules.filter(r => r.isActive).length} rules active • 
                {violations.filter(v => v.errorCount > 0).length} orders with violations
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticalViolations.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                {criticalViolations.length} BLOCKED
              </span>
            )}
            <button
              onClick={() => setShowRulesDashboard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export utility functions for use in other components
export const validatePurchaseOrderForDispatch = (order: any): { canDispatch: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  let canDispatch = true;

  // Critical rule: Invoice required before dispatch
  if (order.invoiceRequired && !order.invoiceCreated) {
    reasons.push('Invoice must be created before goods can be dispatched');
    canDispatch = false;
  }

  // Critical rule: Order must be fully received
  if (!['FULLY_RECEIVED', 'INVOICED', 'COMPLETED'].includes(order.status)) {
    reasons.push('Order must be fully received before dispatch');
    canDispatch = false;
  }

  // Critical rule: Required approvals
  if (order.approvalRequired && !order.approvedBy) {
    reasons.push('Order requires manager approval before dispatch');
    canDispatch = false;
  }

  return { canDispatch, reasons };
};

export const validatePurchaseOrderForCompletion = (order: any): { canComplete: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  let canComplete = true;

  // Must have invoice created
  if (order.invoiceRequired && !order.invoiceCreated) {
    reasons.push('Invoice must be created before order completion');
    canComplete = false;
  }

  // Must be fully received
  if (order.status !== 'FULLY_RECEIVED' && order.status !== 'INVOICED') {
    reasons.push('All items must be received before completion');
    canComplete = false;
  }

  return { canComplete, reasons };
};