import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReportDetail,
  ReportFilters,
  ReportResponse,
} from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  createReport(formData: FormData): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/reports`, formData);
  }

  getCitizenReportHistory(citizenId: number, status?: string, incidentTypeId?: number): Observable<ReportResponse[]> {
    const filters: ReportFilters = {};
    if (status) {
      filters.status = status;
    } else if (incidentTypeId) {
      filters.incidentTypeId = incidentTypeId;
    }

    return this.http.get<ReportResponse[]>(
      `${this.apiUrl}/reports/citizens/${citizenId}/history`,
      { params: this.buildParams(filters) },
    );
  }

  getCitizenHistory(citizenId: number, filters: ReportFilters = {}): Observable<ReportResponse[]> {
    return this.getCitizenReportHistory(
      citizenId,
      filters.status,
      filters.status ? undefined : filters.incidentTypeId,
    );
  }

  getCitizenReportDetail(citizenId: number, reportId: number): Observable<ReportDetail> {
    return this.http.get<ReportDetail>(
      `${this.apiUrl}/reports/citizens/${citizenId}/reports/${reportId}`,
    );
  }

  private buildParams(filters: ReportFilters): HttpParams {
    let params = new HttpParams();
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.incidentTypeId) {
      params = params.set('incidentTypeId', filters.incidentTypeId);
    }
    return params;
  }
}
