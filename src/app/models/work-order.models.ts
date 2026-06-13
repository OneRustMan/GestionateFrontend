import { IncidentTypeResponse, LocationResponse, ReportStatus } from "./report.models";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH";

export type WorkOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PARTIAL_ATTENTION"
  | "COMPLETED";

export interface DeriveReportRequest {
  priority: WorkOrderPriority;
}

export interface DeriveReportResponse {
  workOrderId: number;
  orderCode: string | null;
  reportId: number;
  reportCode: string | null;
  receptionistId: number;
  priority: WorkOrderPriority;
  workOrderStatus: WorkOrderStatus;
  reportStatus: ReportStatus;
  createdAt: string;
}

export interface WorkOrderResponse {
  workOrderId: number;
  orderCode: string | null;
  reportId: number;
  reportCode: string | null;
  description: string;
  reportStatus: ReportStatus;
  priority: WorkOrderPriority;
  workOrderStatus: WorkOrderStatus;
  incidentTypes: IncidentTypeResponse[];
  location: LocationResponse | null;
  createdAt: string;
}

export type WorkOrderSummary = WorkOrderResponse;
export type WorkOrderDetail = WorkOrderResponse;

export interface CompleteWorkOrderRequest {
  observation: string;
}
