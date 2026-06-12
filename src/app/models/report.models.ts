export type ReportStatus = 'RECEIVED' | 'DERIVED' | 'ORDER_COMPLETED' | string;

export interface EvidenceRequest {
  fileName?: string;
  url?: string;
  contentType?: string;
}

export interface IncidentTypeResponse {
  id: number;
  name: string;
  active: boolean;
}

export interface EvidenceResponse {
  id?: number;
  fileName?: string;
  url?: string;
  contentType?: string;
}

export interface LocationResponse {
  addressReference?: string;
  latitude?: number;
  longitude?: number;
  districtName?: string;
  province?: string;
}

export interface ReportResponse {
  id: number;
  reportCode: string;
  citizenId: number;
  description: string;
  status: ReportStatus;
  incidentTypes: IncidentTypeResponse[];
  evidences: EvidenceResponse[];
  location: LocationResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
  id: number;
  reportCode: string;
  description: string;
  location: string | LocationResponse | null;
  status: ReportStatus;
  createdAt?: string;
  updatedAt?: string;
  incidentTypes?: string[] | IncidentTypeResponse[];
  [key: string]: string | number | boolean | string[] | IncidentTypeResponse[] | EvidenceRequest[] | LocationResponse | null | undefined;
}

export interface ReportDetail extends ReportSummary {
  evidences?: EvidenceRequest[];
}

export interface ReportFilters {
  status?: string;
  incidentTypeId?: number;
}
