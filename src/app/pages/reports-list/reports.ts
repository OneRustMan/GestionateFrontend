import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent {
  reportsList = [
    { 
      id: '#12345', 
      tipo: 'Residuos orgánicos', 
      lugar: 'Jr los mojaves 234', 
      fecha: '21/02/2026', 
      estado: 'Recibido',
      description: 'Dejaron basura acumulada en la esquina del parque desde ayer en la noche.'
    },
    { 
      id: '#12346', 
      tipo: 'Desmonte o residuos de construcción', 
      lugar: 'Av. Las Palmas 500', 
      fecha: '22/02/2026', 
      estado: 'Derivado',
      description: 'Hay sacos de escombros bloqueando la vereda peatonal.'
    },
    { 
      id: '#12347', 
      tipo: 'Muebles u objetos voluminosos', 
      lugar: 'Jr los mojaves 234', 
      fecha: '21/02/2026', 
      estado: 'Recibido',
      description: 'Un sillón viejo abandonado en medio de la pista.'
    },
    { 
      id: '#12348', 
      tipo: 'Residuos comerciales', 
      lugar: 'Jr los mojaves 234', 
      fecha: '21/02/2026', 
      estado: 'Recibido',
      description: 'Cajas de cartón bloqueando la entrada del mercado.'
    }
  ];

  selectedReport: any = null;
  selectReport(report: any) {
    this.selectedReport = report;
  }
}