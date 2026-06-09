import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import * as L from "leaflet";
import { GeocodingService } from "../../services/geocoding.service";
import { ReportService } from "../../services/report.service";

@Component({
  selector: "app-create-report",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./create-report.html",
  styleUrls: ["./create-report.css"]
})
export class CreateReportComponent {
  incidentTypes = [
    "Residuos organicos",
    "Desmonte o residuos de construccion",
    "Residuos peligrosos o quimicos",
    "Muebles u objetos voluminosos",
    "Residuos comerciales",
    "Residuos en areas publicas o verdes",
    "Otro tipo de residuo"
  ];

  description = "";
  location = "";
  selectedIncidentType = "";
  selectedFileName = "";
  isSubmitting = false;
  errorMessage = "";

  showModal = false;
  showMapModal = false;
  reportNumber = "";
  reportDate = "";

  map: L.Map | null = null;
  marker: L.Marker | null = null;

  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly reportService: ReportService,
  ) {}

  triggerFileInput() {
    document.querySelector<HTMLInputElement>("input[type=\"file\"]")?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  openMapModal() {
    this.showMapModal = true;
    setTimeout(() => this.initMap(), 100);
  }

  closeMapModal() {
    this.showMapModal = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  initMap() {
    if (this.map) return;

    this.map = L.map("map").setView([-12.0464, -77.0428], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(this.map);

    const iconDefault = L.icon({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    this.map.on("click", (event: L.LeafletMouseEvent) => {
      if (!this.map) return;

      if (this.marker) {
        this.marker.setLatLng(event.latlng);
      } else {
        this.marker = L.marker(event.latlng).addTo(this.map);
      }
      this.reverseGeocode(event.latlng.lat, event.latlng.lng);
    });
  }

  reverseGeocode(lat: number, lng: number) {
    this.geocodingService.reverse(lat, lng).subscribe({
      next: (location) => this.location = location,
      error: () => this.location = this.geocodingService.formatCoordinates(lat, lng),
    });
  }

  confirmLocation() {
    if (!this.location) {
      alert("Por favor selecciona un punto en el mapa");
      return;
    }
    this.closeMapModal();
  }

  onSubmit() {
    if (!this.description.trim() || !this.location.trim() || !this.selectedIncidentType) {
      alert("Por favor, completa los 3 campos principales (Descripcion, Ubicacion y Tipo de incidente) para continuar.");
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = "";

    this.reportService.createReport({
      description: this.description.trim(),
      location: this.location.trim(),
      incidentTypeIds: [this.incidentTypes.indexOf(this.selectedIncidentType) + 1],
      evidences: this.selectedFileName ? [{ fileName: this.selectedFileName }] : [],
    }).pipe(
      finalize(() => this.isSubmitting = false),
    ).subscribe({
      next: (report) => {
        this.reportNumber = report.reportCode;
        this.reportDate = this.formatDate(report.createdAt ? new Date(report.createdAt) : new Date());
        this.showModal = true;
      },
      error: () => this.errorMessage = "No se pudo crear el reporte. Intenta nuevamente.",
    });
  }

  private formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
  }
}
