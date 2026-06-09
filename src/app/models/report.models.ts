export type ReportStatus = 'RECEIVED' | 'DERIVED' | 'ORDER_COMPLETED' | string;

export interface EvidenceRequest {
  fileName?: string;
  url?: string;
  contentType?: string;
}

export interface CreateReportRequest {
  description: string;
  location: string;
  incidentTypeIds: number[];
  evidences?: EvidenceRequest[];
  latitude?: number;
  longitude?: number;
}

export interface ReportSummary {
  id: number;
  reportCode: string;
  description: string;
  location: string;
  status: ReportStatus;
  createdAt?: string;
  updatedAt?: string;
  incidentTypes?: string[];
  [key: string]: string | number | boolean | string[] | EvidenceRequest[] | undefined;
}

export interface ReportDetail extends ReportSummary {
  evidences?: EvidenceRequest[];
}

export interface ReportFilters {
  status?: string;
  incidentTypeId?: number;
}
