import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReceptionReportDetailResponse, ReceptionReportInboxResponse } from '../models/report.models';
import { DeriveReportRequest, WorkOrderDetail } from '../models/work-order.models';

@Injectable({ providedIn: 'root' })
export class ReceptionService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getInboxReports(receptionistId: number, incidentTypeId?: number): Observable<ReceptionReportInboxResponse[]> {
    let params = new HttpParams().set('receptionistId', receptionistId);
    if (incidentTypeId) {
      params = params.set('incidentTypeId', incidentTypeId);
    }
    return this.http.get<ReceptionReportInboxResponse[]>(`${this.apiUrl}/reception/reports/inbox`, { params });
  }

  getReportDetail(receptionistId: number, reportId: number): Observable<ReceptionReportDetailResponse> {
    const params = new HttpParams().set('receptionistId', receptionistId);
    return this.http.get<ReceptionReportDetailResponse>(`${this.apiUrl}/reception/reports/${reportId}/detail`, { params });
  }

  deriveReport(
    reportId: number,
    receptionistId: number,
    request: DeriveReportRequest,
  ): Observable<WorkOrderDetail> {
    const params = new HttpParams().set('receptionistId', receptionistId);
    return this.http.patch<WorkOrderDetail>(
      `${this.apiUrl}/reception/reports/${reportId}/derive`,
      request,
      { params },
    );
  }
}
