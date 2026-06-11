import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReportDetail,
  ReportFilters,
  ReportResponse,
  ReportSummary,
} from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  createReport(formData: FormData): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/reports`, formData);
  }

  getCitizenHistory(citizenId: number, filters: ReportFilters = {}): Observable<ReportSummary[]> {
    return this.http.get<ReportSummary[]>(
      `${this.apiUrl}/reports/citizens/${citizenId}/history`,
      { params: this.buildParams(filters) },
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
