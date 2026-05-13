import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-report.html',
  styleUrls: ['./create-report.css']
})
export class CreateReportComponent {
  incidentTypes = [
    'Residuos orgánicos',
    'Desmonte o residuos de construcción',
    'Residuos peligrosos o químicos',
    'Muebles u objetos voluminosos',
    'Residuos comerciales',
    'Residuos en áreas públicas o verdes',
    'Otro tipo de residuo'
  ];

  description: string = '';
  location: string = '';
  selectedIncidentType: string = '';
  selectedFileName: string = '';

  showModal: boolean = false;
  showMapModal: boolean = false;
  reportNumber: string = '';
  reportDate: string = '';
  
  map: any;
  marker: any;

  triggerFileInput() {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
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
    }
  }

  initMap() {
    if (this.map) return;
    
    // Lima coordinates
    this.map = L.map('map').setView([-12.0464, -77.0428], 12);
    
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

    this.map.on('click', (e: any) => {
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        this.location = data.display_name.split(',').slice(0, 3).join(', ');
      } else {
        this.location = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      this.location = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  confirmLocation() {
    if (!this.location) {
      alert('Por favor selecciona un punto en el mapa');
      return;
    }
    this.closeMapModal();
  }

  onSubmit() {
    if (!this.description.trim() || !this.location.trim() || !this.selectedIncidentType) {
      alert('Por favor, completa los 3 campos principales (Descripción, Ubicación y Tipo de incidente) para continuar.');
      return;
    }

    // Generate mock data for the confirmation
    this.reportNumber = Math.floor(10000 + Math.random() * 90000).toString();
    
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    this.reportDate = `${dd}/${mm}/${yyyy}`;
    
    this.showModal = true;
  }
}
