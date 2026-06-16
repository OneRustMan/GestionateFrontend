import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
import { District } from '../../models/district.models';
import { IncidentTypeResponse } from '../../models/report.models';
import { AuthService } from '../../services/auth.service';
import { DistrictService } from '../../services/district.service';
import { GeocodingService } from '../../services/geocoding.service';
import { IncidentTypeService } from '../../services/incident-type.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-report.html',
  styleUrls: ['./create-report.css']
})
export class CreateReportComponent implements OnInit, OnDestroy {
  incidentTypes: IncidentTypeResponse[] = [];
  districts: District[] = [];

  description = '';
  selectedDistrictId: number | null = null;
  selectedIncidentTypeIds = new Set<number>();
  selectedFiles: File[] = [];

  addressReference = '';
  latitude: number | null = null;
  longitude: number | null = null;

  mapAddressReference = '';
  mapLatitude: number | null = null;
  mapLongitude: number | null = null;

  isSubmitting = false;
  errorMessage = '';

  showModal = false;
  showMapModal = false;
  reportNumber = '';
  reportDate = '';

  map: L.Map | null = null;
  marker: L.Marker | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly districtService: DistrictService,
    private readonly geocodingService: GeocodingService,
    private readonly incidentTypeService: IncidentTypeService,
    private readonly reportService: ReportService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadDistricts();
    this.loadIncidentTypes();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  get selectedDistrict(): District | undefined {
    return this.districts.find((district) => district.id === this.selectedDistrictId);
  }

  triggerFileInput(): void {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (!files.length) {
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      this.errorMessage = 'Adjunta solo evidencias fotográficas.';
    }

    const nextFiles = [...this.selectedFiles, ...imageFiles];
    if (nextFiles.length > 3) {
      this.selectedFiles = nextFiles.slice(0, 3);
      this.errorMessage = 'Solo puedes adjuntar como máximo 3 evidencias.';
      return;
    }

    this.selectedFiles = nextFiles;
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, fileIndex) => fileIndex !== index);
  }

  toggleIncidentType(typeId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedIncidentTypeIds.add(typeId);
      return;
    }

    this.selectedIncidentTypeIds.delete(typeId);
  }

  isIncidentTypeSelected(typeId: number): boolean {
    return this.selectedIncidentTypeIds.has(typeId);
  }

  openMapModal(): void {
    this.showMapModal = true;
    this.mapAddressReference = this.addressReference;
    this.mapLatitude = this.latitude;
    this.mapLongitude = this.longitude;
    setTimeout(() => this.initMap(), 100);
  }

  closeMapModal(): void {
    this.showMapModal = false;
    this.destroyMap();
  }

  initMap(): void {
    if (this.map) return;

    const initialLat = this.mapLatitude ?? -12.0464;
    const initialLng = this.mapLongitude ?? -77.0428;
    this.map = L.map('map').setView([initialLat, initialLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    if (this.mapLatitude !== null && this.mapLongitude !== null) {
      this.marker = L.marker([this.mapLatitude, this.mapLongitude]).addTo(this.map);
    }

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      if (!this.map) return;

      this.mapLatitude = event.latlng.lat;
      this.mapLongitude = event.latlng.lng;

      if (this.marker) {
        this.marker.setLatLng(event.latlng);
      } else {
        this.marker = L.marker(event.latlng).addTo(this.map);
      }
      this.reverseGeocode(event.latlng.lat, event.latlng.lng);
    });
  }

  reverseGeocode(lat: number, lng: number): void {
    this.geocodingService.reverse(lat, lng).subscribe({
      next: (location) => this.mapAddressReference = location,
      error: () => this.mapAddressReference = this.geocodingService.formatCoordinates(lat, lng),
    });
  }

  confirmLocation(): void {
    if (!this.mapAddressReference || this.mapLatitude === null || this.mapLongitude === null) {
      this.errorMessage = 'Selecciona la ubicación en el mapa.';
      return;
    }

    this.addressReference = this.mapAddressReference;
    this.latitude = this.mapLatitude;
    this.longitude = this.mapLongitude;
    this.errorMessage = '';
    this.closeMapModal();
  }

  onSubmit(): void {
    const validationErrors = this.validateReport();
    if (validationErrors.length) {
      this.errorMessage = `Completa los datos obligatorios del reporte. ${validationErrors.join(' ')}`;
      return;
    }

    const citizenId = this.authService.getProfileId();
    const district = this.selectedDistrict;
    if (!citizenId || !district || this.latitude === null || this.longitude === null) {
      this.errorMessage = 'Completa los datos obligatorios del reporte.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.reportService.createReport(this.buildReportFormData(citizenId, district)).pipe(
      finalize(() => this.isSubmitting = false),
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.errorMessage = '';
        void this.router.navigate(['/mis-reportes']);
      },
      error: () => this.errorMessage = 'No se pudo crear el reporte. Intenta nuevamente.',
    });
  }

  onCancel(): void {
    this.resetForm();
    void this.router.navigate(['/home']);
  }

  private loadDistricts(): void {
    this.districtService.getActiveDistricts().subscribe({
      next: (districts) => this.districts = districts.filter((district) => district.active),
      error: () => this.errorMessage = 'No se pudieron cargar los distritos activos.',
    });
  }

  private loadIncidentTypes(): void {
    this.incidentTypeService.getIncidentTypes().subscribe({
      next: (incidentTypes) => this.incidentTypes = incidentTypes.filter((type) => type.active),
      error: () => this.errorMessage = 'No se pudieron cargar los tipos de incidencia.',
    });
  }

  private validateReport(): string[] {
    const errors: string[] = [];
    const citizenId = this.authService.getProfileId();
    const district = this.selectedDistrict;

    if (!this.description.trim()) {
      errors.push('Describe el problema.');
    }
    if (this.description.trim().length > 2000) {
      errors.push('La descripción no debe superar 2000 caracteres.');
    }
    if (!district?.name || !district.province) {
      errors.push('Selecciona el distrito / provincia.');
    }
    if (!this.addressReference.trim() || this.latitude === null || this.longitude === null) {
      errors.push('Selecciona la ubicación en el mapa.');
    }
    if (!this.selectedIncidentTypeIds.size) {
      errors.push('Selecciona al menos un tipo de incidencia.');
    }
    if (!this.selectedFiles.length) {
      errors.push('Adjunta al menos una evidencia fotográfica.');
    }
    if (this.selectedFiles.length > 3) {
      errors.push('Solo puedes adjuntar como máximo 3 evidencias.');
    }
    if (!citizenId) {
      errors.push('No se pudo identificar al ciudadano.');
    }

    return errors;
  }

  private buildReportFormData(citizenId: number, district: District): FormData {
    const formData = new FormData();

    formData.append('citizenId', citizenId.toString());
    formData.append('description', this.description.trim());
    formData.append('districtName', district.name);
    formData.append('province', district.province);
    formData.append('addressReference', this.addressReference.trim());
    formData.append('latitude', String(this.latitude));
    formData.append('longitude', String(this.longitude));

    this.selectedIncidentTypeIds.forEach((id) => {
      formData.append('incidentTypeIds', id.toString());
    });

    this.selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    return formData;
  }

  private resetForm(): void {
    this.description = '';
    this.selectedDistrictId = null;
    this.selectedIncidentTypeIds.clear();
    this.selectedFiles = [];
    this.addressReference = '';
    this.latitude = null;
    this.longitude = null;
    this.mapAddressReference = '';
    this.mapLatitude = null;
    this.mapLongitude = null;
    this.errorMessage = '';
    this.destroyMap();
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
  }
}
