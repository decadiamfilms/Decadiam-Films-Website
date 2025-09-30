export interface PurchaseOrderState {
  status: string;
  canTransitionTo: string[];
}

class PurchaseOrderStateMachine {
  private static instance: PurchaseOrderStateMachine;
  
  public static getInstance(): PurchaseOrderStateMachine {
    if (!PurchaseOrderStateMachine.instance) {
      PurchaseOrderStateMachine.instance = new PurchaseOrderStateMachine();
    }
    return PurchaseOrderStateMachine.instance;
  }

  public canTransition(fromStatus: string, toStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'draft': ['pending_approval', 'approved'],
      'pending_approval': ['approved', 'cancelled'],
      'approved': ['sent_to_supplier'],
      'sent_to_supplier': ['supplier_confirmed'],
      'supplier_confirmed': ['partially_received', 'fully_received'],
      'partially_received': ['fully_received'],
      'fully_received': ['invoiced'],
      'invoiced': ['completed'],
      'completed': []
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  public getNextValidStates(currentStatus: string): string[] {
    const validTransitions: Record<string, string[]> = {
      'draft': ['pending_approval', 'approved'],
      'pending_approval': ['approved', 'cancelled'],
      'approved': ['sent_to_supplier'],
      'sent_to_supplier': ['supplier_confirmed'],
      'supplier_confirmed': ['partially_received', 'fully_received'],
      'partially_received': ['fully_received'],
      'fully_received': ['invoiced'],
      'invoiced': ['completed'],
      'completed': []
    };

    return validTransitions[currentStatus] || [];
  }
}

export default PurchaseOrderStateMachine;