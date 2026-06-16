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
  id: number;
  reportId: number;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface LocationResponse {
  id?: number;
  reportId?: number;
  addressReference: string;
  districtName: string;
  province: string;
  latitude: number;
  longitude: number;
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

export interface ReceptionReportInboxResponse {
  reportId: number;
  reportCode: string;
  citizenId: number;
  citizenFullName: string;
  description: string;
  status: ReportStatus;
  incidentTypes: IncidentTypeResponse[];
  location: LocationResponse | null;
  createdAt: string;
}

export interface ReceptionReportDetailResponse {
  reportId: number;
  reportCode: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  citizenId: number;
  citizenFullName: string;
  citizenDni: string;
  citizenPhone: string;
  citizenEmail: string;
  incidentTypes: IncidentTypeResponse[];
  location: LocationResponse | null;
  evidences: EvidenceResponse[];
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
  [key: string]: string | number | boolean | string[] | IncidentTypeResponse[] | EvidenceRequest[] | EvidenceResponse[] | LocationResponse | null | undefined;
}

export interface ReportFilters {
  status?: string;
  incidentTypeId?: number;
}
