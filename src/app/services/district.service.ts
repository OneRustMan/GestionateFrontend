import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { District } from '../models/district.models';

@Injectable({ providedIn: 'root' })
export class DistrictService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getActiveDistricts(): Observable<District[]> {
    return this.http.get<District[]>(`${this.apiUrl}/districts`);
  }
}
