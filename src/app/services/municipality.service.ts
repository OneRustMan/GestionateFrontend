import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MunicipalityResponse } from '../models/municipality.models';

@Injectable({ providedIn: 'root' })
export class MunicipalityService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getMunicipalities(): Observable<MunicipalityResponse[]> {
    return this.http.get<MunicipalityResponse[]>(`${this.apiUrl}/municipalities`);
  }
}
