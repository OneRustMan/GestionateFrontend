import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  
  currentUserRole: string = 'ciudadano'; 
  currentView: string = 'ciudadano-mis-reportes'; 

  // Variables para controlar los formularios de Recepcionista y Operativo
  showCoordinarForm: boolean = false;
  showDenegarForm: boolean = false; // NUEVO: Controla la vista de denegación

  reportsList = [
    { 
      id: '#12345', 
      tipo: 'Residuos orgánicos', 
      lugar: 'Jr los mojaves 234', 
      fecha: '21/02/2026', 
      estado: 'Recibido',
      description: 'Dejaron basura acumulada en la esquina del parque desde ayer.'
    },
    { 
      id: '#12346', 
      tipo: 'Desmonte o residuos de construcción', 
      lugar: 'Jr los mojaves 234', 
      fecha: '21/02/2026', 
      estado: 'Pendiente de Recepción',
      description: 'Hay sacos de escombros bloqueando la vereda peatonal.'
    },
    { 
      id: '#12347', 
      tipo: 'Muebles u objetos voluminosos', 
      lugar: 'Jr los mojaves 234', 
      fecha: '21/02/2026', 
      estado: 'En Proceso',
      description: 'Un sillón viejo abandonado en medio de la pista.'
    },
    { 
      id: '#12348', 
      tipo: 'Residuos comerciales', 
      lugar: 'Jr los mojaves 234', 
      fecha: '21/02/2026', 
      estado: 'Completado',
      description: 'Cajas de cartón bloqueando la entrada del mercado.'
    }
  ];

  selectedReport: any = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.determinarRolPorUrl(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.determinarRolPorUrl(event.urlAfterRedirects);
    });
  }

  determinarRolPorUrl(url: string) {
    this.selectedReport = null; 
    this.showCoordinarForm = false; 
    this.showDenegarForm = false; 

    if (url.includes('reportes-recibidos')) {
      this.currentUserRole = 'recepcionista';
      this.currentView = 'recepcionista-recibidos';
    } else if (url.includes('reportes-derivados')) {
      this.currentUserRole = 'recepcionista';
      this.currentView = 'recepcionista-derivados';
    } else if (url.includes('ordenes-asignadas')) {
      this.currentUserRole = 'operativo';
      this.currentView = 'operativo-asignadas';
    } else if (url.includes('ordenes-completadas')) {
      this.currentUserRole = 'operativo';
      this.currentView = 'operativo-completadas';
    } else {
      this.currentUserRole = 'ciudadano';
      this.currentView = 'ciudadano-mis-reportes';
    }
  }

  selectReport(report: any) {
    this.selectedReport = report;
    this.showCoordinarForm = false; 
    this.showDenegarForm = false; 
  }

  // --- FUNCIONES DEL RECEPCIONISTA ---
  derivar() {
    alert(`Reporte ${this.selectedReport.id} derivado al Área Operativa con éxito.`);
    this.selectedReport.estado = 'Pendiente de Recepción';
  }

  abrirFormularioDenegar() {
    this.showDenegarForm = true;
  }

  confirmarDenegacion() {
    alert(`Reporte ${this.selectedReport.id} ha sido denegado.`);
    this.showDenegarForm = false;
  }

  // --- FUNCIONES DEL ÁREA OPERATIVA ---
  abrirFormularioCoordinar() {
    this.showCoordinarForm = true;
  }

  confirmarCoordinacion() {
    alert(`Equipo asignado correctamente.`);
    this.selectedReport.estado = 'En Proceso';
    this.showCoordinarForm = false;
  }

  registrarInforme() {
    alert(`Informe registrado para el reporte ${this.selectedReport.id}`);
  }
}