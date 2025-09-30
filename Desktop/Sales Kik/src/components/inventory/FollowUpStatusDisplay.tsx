import React, { useState, useEffect } from 'react';
import { getFollowUpStatusData } from '../../services/AutomatedFollowUpService';

interface FollowUpStatusDisplayProps {
  orderId?: string;
}

export default function FollowUpStatusDisplay({ orderId }: FollowUpStatusDisplayProps) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    setStatus(getFollowUpStatusData(orderId));
  }, [orderId]);

  if (!status) return null;

  if (orderId) {
    // Order-specific status
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-3">Automated Follow-Up Status</h5>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-yellow-600">{status.pendingFollowUps}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{status.executedFollowUps}</div>
            <div className="text-xs text-gray-600">Executed</div>
          </div>
        </div>
        {status.nextScheduled && (
          <div className="mt-3 text-sm text-gray-600">
            Next action: {new Date(status.nextScheduled).toLocaleString()}
          </div>
        )}
      </div>
    );
  } else {
    // System-wide status
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-2">Follow-Up System</h5>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{status.activeRules}</div>
            <div className="text-xs text-gray-600">Active Rules</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">{status.pendingFollowUps}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center mt-2">
          <div>
            <div className="text-lg font-bold text-green-600">{status.executedToday}</div>
            <div className="text-xs text-gray-600">Today</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{status.failedFollowUps}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>
      </div>
    );
  }
}