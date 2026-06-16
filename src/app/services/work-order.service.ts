import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CompleteWorkOrderRequest,
  CompleteWorkOrderResponse,
  TakeWorkOrderResponse,
  WorkOrderDetail,
  WorkOrderDetailResponse,
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

  getWorkOrderDetail(cleaningStaffId: number, workOrderId: number): Observable<WorkOrderDetailResponse> {
    const params = new HttpParams().set("cleaningStaffId", cleaningStaffId);
    return this.http.get<WorkOrderDetailResponse>(`${this.apiUrl}/work-orders/${workOrderId}/detail`, { params });
  }

  getDetail(workOrderId: number, cleaningStaffId: number): Observable<WorkOrderDetail> {
    return this.getWorkOrderDetail(cleaningStaffId, workOrderId);
  }

  takeWorkOrder(cleaningStaffId: number, workOrderId: number): Observable<TakeWorkOrderResponse> {
    const params = new HttpParams().set("cleaningStaffId", cleaningStaffId);
    return this.http.patch<TakeWorkOrderResponse>(`${this.apiUrl}/work-orders/${workOrderId}/take`, null, { params });
  }

  take(workOrderId: number, cleaningStaffId: number): Observable<TakeWorkOrderResponse> {
    return this.takeWorkOrder(cleaningStaffId, workOrderId);
  }

  completeWorkOrder(
    cleaningStaffId: number,
    workOrderId: number,
    request: CompleteWorkOrderRequest,
  ): Observable<CompleteWorkOrderResponse> {
    const params = new HttpParams().set("cleaningStaffId", cleaningStaffId);
    return this.http.patch<CompleteWorkOrderResponse>(
      this.apiUrl + "/work-orders/" + workOrderId + "/complete",
      request,
      { params },
    );
  }

  complete(
    workOrderId: number,
    cleaningStaffId: number,
    request: CompleteWorkOrderRequest,
  ): Observable<CompleteWorkOrderResponse> {
    return this.completeWorkOrder(cleaningStaffId, workOrderId, request);
  }
}
