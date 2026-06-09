import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpdateProfileRequest, UserProfile } from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/profile`, request);
  }
}
