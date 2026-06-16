import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpdateProfileRequest, UserProfileResponse } from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getMyProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/profile`);
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<UserProfileResponse> {
    return this.http.patch<UserProfileResponse>(`${this.apiUrl}/profile`, request);
  }
}
