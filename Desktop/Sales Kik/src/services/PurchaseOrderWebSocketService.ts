import { useState, useEffect } from 'react';

export interface WebSocketMessage {
  type: 'status_update' | 'notification' | 'supplier_confirmation';
  orderId: string;
  newStatus?: string;
  message?: string;
  timestamp: string;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  queuedMessages: number;
}

export function usePurchaseOrderWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: true,
    reconnecting: false,
    queuedMessages: 0
  });
  
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  // Mock connection status for now
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(prev => ({
        ...prev,
        connected: Math.random() > 0.1 // 90% uptime simulation
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { connectionStatus, messages };
}