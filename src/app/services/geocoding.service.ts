import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface NominatimReverseResponse {
  display_name?: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  constructor(private readonly http: HttpClient) {}

  reverse(lat: number, lon: number): Observable<string> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('lat', lat)
      .set('lon', lon);

    return this.http.get<NominatimReverseResponse>(environment.nominatimReverseUrl, { params }).pipe(
      map((response) => response.display_name?.split(',').slice(0, 3).join(', ') || this.formatCoordinates(lat, lon)),
    );
  }

  formatCoordinates(lat: number, lon: number): string {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}
