import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IncidentTypeResponse } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class IncidentTypeService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getIncidentTypes(): Observable<IncidentTypeResponse[]> {
    return this.http.get<IncidentTypeResponse[]>(`${this.apiUrl}/incident-types`);
  }
}
