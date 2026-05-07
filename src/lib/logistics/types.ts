export type TransferWorkflowStatus =
  | "requested"
  | "approved"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "completed"
  | "disputed";

export type TransferOrderView = {
  id: string;
  transferCode: string;
  fromMinistryCode: string;
  toMinistryCode: string;
  fromName: string;
  toName: string;
  sku: string;
  quantity: number;
  status: TransferWorkflowStatus;
  requestedAt: string;
  approvedAt?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  operatorLabel?: string | null;
  notes?: string | null;
  source: "supabase" | "canonical" | "local";
};

export type MovementTimelineRow = {
  id: string;
  at: string;
  movementType: string;
  source: string;
  destination: string;
  quantity: number;
  operator: string;
  status: string;
  reference: string;
};
