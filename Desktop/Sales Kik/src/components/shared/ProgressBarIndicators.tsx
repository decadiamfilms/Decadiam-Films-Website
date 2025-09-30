// Progress Bar Indicators for Purchase Order Workflow
// Visual completion tracking, milestone markers, and workflow progression

import React from 'react';
import { 
  CheckCircleIcon, ClockIcon, ExclamationTriangleIcon,
  DocumentTextIcon, UserCheckIcon, TruckIcon,
  ReceiptPercentIcon, BanknotesIcon, CheckBadgeIcon,
  XCircleIcon, PauseCircleIcon
} from '@heroicons/react/24/outline';

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'BLOCKED' | 'SKIPPED' | 'FAILED';
  completedAt?: Date;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
  icon: React.ComponentType<any>;
  requirements?: string[];
  blockingReasons?: string[];
}

export interface ProgressCalculation {
  overallProgress: number; // 0-100
  currentStage: number; // Index of current stage
  totalStages: number;
  estimatedCompletion?: Date;
  timeElapsed: number; // minutes since creation
  averageStageTime: number; // minutes per stage
  efficiency: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'SLOW' | 'BLOCKED';
  blockedStages: number;
  criticalPath: string[];
}

interface ProgressBarIndicatorsProps {
  purchaseOrder: any;
  variant?: 'COMPACT' | 'DETAILED' | 'TIMELINE';
  showEstimates?: boolean;
  showBlockingReasons?: boolean;
  onStageClick?: (stage: WorkflowStage) => void;
}

export default function ProgressBarIndicators({ 
  purchaseOrder, 
  variant = 'DETAILED',
  showEstimates = true,
  showBlockingReasons = true,
  onStageClick 
}: ProgressBarIndicatorsProps) {
  
  // Define purchase order workflow stages
  const getWorkflowStages = (order: any): WorkflowStage[] => {
    const stages: WorkflowStage[] = [
      {
        id: 'created',
        name: 'Order Created',
        description: 'Purchase order created and configured',
        status: 'COMPLETED',
        completedAt: new Date(order.createdAt),
        estimatedDuration: 15,
        actualDuration: 0,
        icon: DocumentTextIcon,
        requirements: ['Supplier selected', 'Line items added', 'Attachments uploaded']
      },
      {
        id: 'approval',
        name: 'Approval Process',
        description: 'Manager approval and authorization',
        status: getStageStatus(order, 'approval'),
        completedAt: order.approvalDate ? new Date(order.approvalDate) : undefined,
        estimatedDuration: 120, // 2 hours
        actualDuration: calculateActualDuration(order, 'approval'),
        icon: UserCheckIcon,
        requirements: order.approvalRequired ? ['Manager approval'] : [],
        blockingReasons: getBlockingReasons(order, 'approval')
      },
      {
        id: 'supplier_delivery',
        name: 'Supplier Delivery',
        description: 'Sent to supplier and confirmation',
        status: getStageStatus(order, 'supplier_delivery'),
        completedAt: order.supplierConfirmedDate ? new Date(order.supplierConfirmedDate) : undefined,
        estimatedDuration: 1440, // 24 hours
        actualDuration: calculateActualDuration(order, 'supplier_delivery'),
        icon: TruckIcon,
        requirements: ['Supplier email delivery', 'Supplier confirmation'],
        blockingReasons: getBlockingReasons(order, 'supplier_delivery')
      },
      {
        id: 'goods_receipt',
        name: 'Goods Receipt',
        description: 'Items received and processed',
        status: getStageStatus(order, 'goods_receipt'),
        completedAt: order.fullyReceivedDate ? new Date(order.fullyReceivedDate) : undefined,
        estimatedDuration: 60, // 1 hour
        actualDuration: calculateActualDuration(order, 'goods_receipt'),
        icon: ReceiptPercentIcon,
        requirements: ['Delivery confirmation', 'Receipt processing', 'Quality check'],
        blockingReasons: getBlockingReasons(order, 'goods_receipt')
      },
      {
        id: 'invoice_creation',
        name: 'Invoice Processing',
        description: 'Invoice creation and validation',
        status: getStageStatus(order, 'invoice_creation'),
        completedAt: order.invoiceCreatedDate ? new Date(order.invoiceCreatedDate) : undefined,
        estimatedDuration: 30,
        actualDuration: calculateActualDuration(order, 'invoice_creation'),
        icon: BanknotesIcon,
        requirements: ['Invoice upload', 'Invoice matching', 'Approval'],
        blockingReasons: getBlockingReasons(order, 'invoice_creation')
      },
      {
        id: 'completion',
        name: 'Order Completion',
        description: 'Final closure and documentation',
        status: getStageStatus(order, 'completion'),
        completedAt: order.completedDate ? new Date(order.completedDate) : undefined,
        estimatedDuration: 15,
        actualDuration: calculateActualDuration(order, 'completion'),
        icon: CheckBadgeIcon,
        requirements: ['All items received', 'Invoice processed', 'Dispatch cleared'],
        blockingReasons: getBlockingReasons(order, 'completion')
      }
    ];

    // Filter out approval stage if not required
    if (!order.approvalRequired) {
      stages[1].status = 'SKIPPED';
    }

    return stages;
  };

  const getStageStatus = (order: any, stageId: string): WorkflowStage['status'] => {
    switch (stageId) {
      case 'approval':
        if (!order.approvalRequired) return 'SKIPPED';
        if (order.status === 'CANCELLED') return 'FAILED';
        if (order.approvedBy) return 'COMPLETED';
        if (order.status === 'PENDING_APPROVAL') return 'CURRENT';
        if (['DRAFT'].includes(order.status)) return 'PENDING';
        return 'BLOCKED';

      case 'supplier_delivery':
        if (order.status === 'CANCELLED') return 'FAILED';
        if (order.supplierConfirmedDate) return 'COMPLETED';
        if (['SENT_TO_SUPPLIER', 'CONFIRMATION_PENDING'].includes(order.status)) return 'CURRENT';
        if (order.status === 'CONFIRMATION_OVERDUE') return 'BLOCKED';
        if (['APPROVED'].includes(order.status)) return 'PENDING';
        return 'PENDING';

      case 'goods_receipt':
        if (order.status === 'CANCELLED') return 'FAILED';
        if (['FULLY_RECEIVED', 'INVOICED', 'COMPLETED'].includes(order.status)) return 'COMPLETED';
        if (['SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)) return 'CURRENT';
        return 'PENDING';

      case 'invoice_creation':
        if (order.status === 'CANCELLED') return 'FAILED';
        if (['INVOICED', 'COMPLETED'].includes(order.status)) return 'COMPLETED';
        if (order.status === 'FULLY_RECEIVED' && order.invoiceRequired) return 'CURRENT';
        if (order.status === 'FULLY_RECEIVED' && !order.invoiceRequired) return 'SKIPPED';
        return 'PENDING';

      case 'completion':
        if (order.status === 'CANCELLED') return 'FAILED';
        if (order.status === 'COMPLETED') return 'COMPLETED';
        if (order.status === 'INVOICED' && !order.dispatchBlocked) return 'CURRENT';
        return 'PENDING';

      default:
        return 'PENDING';
    }
  };

  const getBlockingReasons = (order: any, stageId: string): string[] => {
    const reasons: string[] = [];

    switch (stageId) {
      case 'approval':
        if (order.status === 'PENDING_APPROVAL') {
          reasons.push('Awaiting manager approval');
          if (order.totalAmount > 10000) {
            reasons.push('High value order requires senior approval');
          }
        }
        break;

      case 'supplier_delivery':
        if (order.status === 'CONFIRMATION_OVERDUE') {
          const hoursOverdue = calculateHoursOverdue(order);
          reasons.push(`Supplier confirmation overdue (${hoursOverdue}h)`);
        }
        break;

      case 'invoice_creation':
        if (order.status === 'FULLY_RECEIVED' && order.invoiceRequired && !order.invoiceCreated) {
          reasons.push('Invoice upload and validation required');
          reasons.push('Dispatch blocked until invoice processed');
        }
        break;
    }

    return reasons;
  };

  const calculateActualDuration = (order: any, stageId: string): number | undefined => {
    // Calculate actual time spent in each stage
    const createdAt = new Date(order.createdAt);
    const approvalDate = order.approvalDate ? new Date(order.approvalDate) : null;
    const sentDate = order.sentToSupplierDate ? new Date(order.sentToSupplierDate) : null;
    const confirmedDate = order.supplierConfirmedDate ? new Date(order.supplierConfirmedDate) : null;
    const receivedDate = order.fullyReceivedDate ? new Date(order.fullyReceivedDate) : null;
    const invoiceDate = order.invoiceCreatedDate ? new Date(order.invoiceCreatedDate) : null;
    const completedDate = order.completedDate ? new Date(order.completedDate) : null;

    switch (stageId) {
      case 'approval':
        if (approvalDate) {
          return Math.floor((approvalDate.getTime() - createdAt.getTime()) / (1000 * 60));
        }
        break;
      case 'supplier_delivery':
        if (confirmedDate && sentDate) {
          return Math.floor((confirmedDate.getTime() - sentDate.getTime()) / (1000 * 60));
        }
        break;
      case 'goods_receipt':
        if (receivedDate && confirmedDate) {
          return Math.floor((receivedDate.getTime() - confirmedDate.getTime()) / (1000 * 60));
        }
        break;
      case 'invoice_creation':
        if (invoiceDate && receivedDate) {
          return Math.floor((invoiceDate.getTime() - receivedDate.getTime()) / (1000 * 60));
        }
        break;
      case 'completion':
        if (completedDate && invoiceDate) {
          return Math.floor((completedDate.getTime() - invoiceDate.getTime()) / (1000 * 60));
        }
        break;
    }
    return undefined;
  };

  const calculateHoursOverdue = (order: any): number => {
    if (order.status === 'CONFIRMATION_OVERDUE' && order.sentToSupplierDate) {
      const sentDate = new Date(order.sentToSupplierDate);
      return Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60));
    }
    return 0;
  };

  const calculateProgress = (stages: WorkflowStage[]): ProgressCalculation => {
    const totalStages = stages.filter(stage => stage.status !== 'SKIPPED').length;
    const completedStages = stages.filter(stage => stage.status === 'COMPLETED').length;
    const blockedStages = stages.filter(stage => stage.status === 'BLOCKED').length;
    const currentStageIndex = stages.findIndex(stage => stage.status === 'CURRENT');

    const overallProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
    
    const createdAt = new Date(purchaseOrder.createdAt);
    const timeElapsed = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60));
    
    const completedWithDuration = stages.filter(stage => 
      stage.status === 'COMPLETED' && stage.actualDuration
    );
    const averageStageTime = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, stage) => sum + (stage.actualDuration || 0), 0) / completedWithDuration.length
      : 0;

    // Estimate completion based on remaining stages
    const remainingStages = stages.filter(stage => 
      ['PENDING', 'CURRENT'].includes(stage.status)
    );
    const estimatedRemainingTime = remainingStages.reduce((sum, stage) => 
      sum + (stage.estimatedDuration || 0), 0
    );
    const estimatedCompletion = new Date(Date.now() + estimatedRemainingTime * 60 * 1000);

    // Determine efficiency
    let efficiency: ProgressCalculation['efficiency'];
    if (blockedStages > 0) {
      efficiency = 'BLOCKED';
    } else if (averageStageTime > 0) {
      const expectedTime = stages.filter(s => s.status === 'COMPLETED')
        .reduce((sum, stage) => sum + (stage.estimatedDuration || 0), 0);
      const actualTime = completedWithDuration
        .reduce((sum, stage) => sum + (stage.actualDuration || 0), 0);
      
      if (actualTime <= expectedTime * 0.8) efficiency = 'EXCELLENT';
      else if (actualTime <= expectedTime) efficiency = 'GOOD';
      else if (actualTime <= expectedTime * 1.5) efficiency = 'AVERAGE';
      else efficiency = 'SLOW';
    } else {
      efficiency = 'AVERAGE';
    }

    return {
      overallProgress,
      currentStage: Math.max(0, currentStageIndex),
      totalStages,
      estimatedCompletion: remainingStages.length > 0 ? estimatedCompletion : undefined,
      timeElapsed,
      averageStageTime,
      efficiency,
      blockedStages,
      criticalPath: stages.filter(stage => stage.requirements?.length).map(stage => stage.name)
    };
  };

  const stages = getWorkflowStages(purchaseOrder);
  const progress = calculateProgress(stages);

  const getStageIcon = (stage: WorkflowStage) => {
    const IconComponent = stage.icon;
    
    switch (stage.status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'CURRENT':
        return <ClockIcon className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'BLOCKED':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />;
      case 'FAILED':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'SKIPPED':
        return <div className="w-6 h-6 text-gray-400 flex items-center justify-center">—</div>;
      default:
        return <IconComponent className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStageColor = (stage: WorkflowStage) => {
    switch (stage.status) {
      case 'COMPLETED': return 'bg-green-100 border-green-300 text-green-800';
      case 'CURRENT': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'BLOCKED': return 'bg-red-100 border-red-300 text-red-800';
      case 'FAILED': return 'bg-red-100 border-red-300 text-red-800';
      case 'SKIPPED': return 'bg-gray-100 border-gray-300 text-gray-600';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getProgressBarColor = (efficiency: string) => {
    switch (efficiency) {
      case 'EXCELLENT': return 'bg-green-500';
      case 'GOOD': return 'bg-blue-500';
      case 'AVERAGE': return 'bg-yellow-500';
      case 'SLOW': return 'bg-orange-500';
      case 'BLOCKED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (variant === 'COMPACT') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Order Progress</span>
          <span className="text-sm font-bold text-gray-900">{progress.overallProgress.toFixed(0)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(progress.efficiency)}`}
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Stage {progress.currentStage + 1} of {progress.totalStages}</span>
          <span className={`font-medium ${
            progress.efficiency === 'BLOCKED' ? 'text-red-600' :
            progress.efficiency === 'EXCELLENT' ? 'text-green-600' :
            'text-gray-600'
          }`}>
            {progress.efficiency}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'TIMELINE') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-medium text-gray-900">Purchase Order Timeline</h4>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {progress.overallProgress.toFixed(0)}% Complete
            </span>
            <span className={`text-sm font-medium ${
              progress.efficiency === 'BLOCKED' ? 'text-red-600' :
              progress.efficiency === 'EXCELLENT' ? 'text-green-600' :
              'text-gray-600'
            }`}>
              {progress.efficiency}
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Timeline items */}
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative flex items-start gap-4">
                {/* Timeline node */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStageColor(stage)}`}>
                  {getStageIcon(stage)}
                </div>
                
                {/* Stage content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">{stage.name}</h5>
                    <div className="flex items-center gap-2">
                      {stage.completedAt && (
                        <span className="text-xs text-gray-500">
                          {stage.completedAt.toLocaleString()}
                        </span>
                      )}
                      {showEstimates && stage.actualDuration && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {stage.actualDuration}m
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                  
                  {stage.requirements && stage.requirements.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Requirements:</div>
                      <div className="space-y-1">
                        {stage.requirements.map((req, reqIndex) => (
                          <div key={reqIndex} className="flex items-center gap-2 text-xs">
                            <CheckCircleIcon className="w-3 h-3 text-green-500" />
                            <span className="text-gray-600">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {showBlockingReasons && stage.blockingReasons && stage.blockingReasons.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs font-medium text-red-800 mb-1">Blocking Issues:</div>
                      <div className="space-y-1">
                        {stage.blockingReasons.map((reason, reasonIndex) => (
                          <div key={reasonIndex} className="flex items-center gap-2 text-xs text-red-700">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{progress.overallProgress.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{Math.floor(progress.timeElapsed / 60)}h</div>
              <div className="text-sm text-gray-600">Elapsed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{progress.averageStageTime.toFixed(0)}m</div>
              <div className="text-sm text-gray-600">Avg Stage</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                progress.blockedStages > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {progress.blockedStages}
              </div>
              <div className="text-sm text-gray-600">Blocked</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default DETAILED variant
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-medium text-gray-900">Order Progress</h4>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {progress.overallProgress.toFixed(0)}% Complete
          </span>
          {progress.estimatedCompletion && (
            <span className="text-sm text-gray-500">
              Est. completion: {progress.estimatedCompletion.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
          <div 
            className={`h-4 rounded-full transition-all duration-1000 ${getProgressBarColor(progress.efficiency)}`}
            style={{ width: `${progress.overallProgress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {progress.overallProgress.toFixed(0)}%
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Started {new Date(purchaseOrder.createdAt).toLocaleDateString()}</span>
          <span className={`font-medium ${
            progress.efficiency === 'BLOCKED' ? 'text-red-600' :
            progress.efficiency === 'EXCELLENT' ? 'text-green-600' :
            'text-gray-600'
          }`}>
            {progress.efficiency}
          </span>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage, index) => (
          <div 
            key={stage.id}
            onClick={() => onStageClick?.(stage)}
            className={`border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${getStageColor(stage)}`}
          >
            <div className="flex items-center gap-3 mb-2">
              {getStageIcon(stage)}
              <div className="flex-1">
                <h5 className="font-medium text-sm">{stage.name}</h5>
                <p className="text-xs text-gray-600">{stage.description}</p>
              </div>
              <span className="text-xs font-bold">
                {index + 1}
              </span>
            </div>

            {/* Stage timing */}
            {(stage.actualDuration || stage.estimatedDuration) && showEstimates && (
              <div className="text-xs text-gray-600 mt-2">
                {stage.actualDuration ? (
                  <span>Completed in {stage.actualDuration}m</span>
                ) : stage.status === 'CURRENT' ? (
                  <span>Est. {stage.estimatedDuration}m remaining</span>
                ) : (
                  <span>Est. {stage.estimatedDuration}m</span>
                )}
              </div>
            )}

            {/* Blocking reasons */}
            {stage.blockingReasons && stage.blockingReasons.length > 0 && showBlockingReasons && (
              <div className="mt-2 text-xs">
                <div className="font-medium text-red-700 mb-1">Blocked:</div>
                {stage.blockingReasons.map((reason, reasonIndex) => (
                  <div key={reasonIndex} className="text-red-600">• {reason}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Critical Path and Efficiency Insights */}
      {progress.efficiency === 'BLOCKED' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-900">Workflow Blocked</span>
          </div>
          <p className="text-sm text-red-700">
            {progress.blockedStages} stage{progress.blockedStages !== 1 ? 's' : ''} blocked. 
            Immediate attention required to proceed with order.
          </p>
        </div>
      )}

      {progress.efficiency === 'EXCELLENT' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Excellent Progress</span>
          </div>
          <p className="text-sm text-green-700">
            Order is progressing {Math.floor(progress.timeElapsed / 60)}h ahead of schedule. 
            Expected completion: {progress.estimatedCompletion?.toLocaleDateString()}.
          </p>
        </div>
      )}
    </div>
  );
}