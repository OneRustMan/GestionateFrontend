import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CompleteWorkOrderRequest,
  WorkOrderDetail,
  WorkOrderPriority,
  WorkOrderResponse,
} from '../models/work-order.models';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getAvailableWorkOrders(cleaningStaffId: number, priority?: WorkOrderPriority): Observable<WorkOrderResponse[]> {
    let params = new HttpParams().set("cleaningStaffId", cleaningStaffId);
    if (priority) {
      params = params.set("priority", priority);
    }
    return this.http.get<WorkOrderResponse[]>(`${this.apiUrl}/work-orders/available`, { params });
  }

  getAvailable(cleaningStaffId: number, priority?: WorkOrderPriority): Observable<WorkOrderResponse[]> {
    return this.getAvailableWorkOrders(cleaningStaffId, priority);
  }

  getCompletedWorkOrders(cleaningStaffId: number, priority?: WorkOrderPriority): Observable<WorkOrderResponse[]> {
    let params = new HttpParams().set("cleaningStaffId", cleaningStaffId);
    if (priority) {
      params = params.set("priority", priority);
    }
    return this.http.get<WorkOrderResponse[]>(`${this.apiUrl}/work-orders/completed`, { params });
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
