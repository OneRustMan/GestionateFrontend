import { ReportStatus } from './report.models';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;

export interface DeriveReportRequest {
  priority: WorkOrderPriority;
}

export interface DeriveReportResponse {
  workOrderId: number;
  orderCode: string;
  reportId: number;
  reportCode: string;
  receptionistId: number;
  priority: WorkOrderPriority;
  workOrderStatus: WorkOrderStatus;
  reportStatus: ReportStatus;
  createdAt: string;
}

export interface WorkOrderSummary {
  id: number;
  reportId: number;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  createdAt?: string;
  completedAt?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkOrderDetail extends WorkOrderSummary {
  description?: string;
  location?: string;
  reportCode?: string;
}

export interface CompleteWorkOrderRequest {
  observation: string;
}
