import { useState } from 'react';

interface ActionLog {
  id: string;
  action: string;
  details: any;
  timestamp: Date;
  userId: string;
  userName: string;
}

export function useActionLogger() {
  const [actionHistory, setActionHistory] = useState<ActionLog[]>([]);

  const logAction = async (action: string, details: any) => {
    try {
      const logEntry: ActionLog = {
        id: Date.now().toString(),
        action,
        details,
        timestamp: new Date(),
        userId: 'current-user-id', // In production, get from auth context
        userName: 'Current User' // In production, get from auth context
      };

      // Log to console for development
      console.log('Action logged:', logEntry);

      // Add to local history
      setActionHistory(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 actions

      // In production, send to API
      // await fetch('/api/action-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });

    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  return {
    logAction,
    actionHistory
  };
}