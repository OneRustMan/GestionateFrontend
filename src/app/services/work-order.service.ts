import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CompleteWorkOrderRequest,
  WorkOrderDetail,
  WorkOrderPriority,
  WorkOrderSummary,
} from '../models/work-order.models';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getAvailable(cleaningStaffId: number, priority?: WorkOrderPriority): Observable<WorkOrderSummary[]> {
    let params = new HttpParams().set('cleaningStaffId', cleaningStaffId);
    if (priority) {
      params = params.set('priority', priority);
    }
    return this.http.get<WorkOrderSummary[]>(`${this.apiUrl}/work-orders/available`, { params });
  }

  getDetail(workOrderId: number, cleaningStaffId: number): Observable<WorkOrderDetail> {
    const params = new HttpParams().set('cleaningStaffId', cleaningStaffId);
    return this.http.get<WorkOrderDetail>(`${this.apiUrl}/work-orders/${workOrderId}/detail`, { params });
  }

  take(workOrderId: number, cleaningStaffId: number): Observable<WorkOrderDetail> {
    const params = new HttpParams().set('cleaningStaffId', cleaningStaffId);
    return this.http.patch<WorkOrderDetail>(`${this.apiUrl}/work-orders/${workOrderId}/take`, {}, { params });
  }

  complete(
    workOrderId: number,
    cleaningStaffId: number,
    request: CompleteWorkOrderRequest,
  ): Observable<WorkOrderDetail> {
    const params = new HttpParams().set('cleaningStaffId', cleaningStaffId);
    return this.http.patch<WorkOrderDetail>(
      `${this.apiUrl}/work-orders/${workOrderId}/complete`,
      request,
      { params },
    );
  }
}
