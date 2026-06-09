import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  recentReports = [
    { 
      title: 'Reporte acumulación de basura', 
      description: 'Calle 15, frente al colegio, basura acumulada...' 
    },
    { 
      title: 'Reporte no recojo de basura', 
      description: 'Calle 13, frente al mercado, basura acumulada...' 
    }
  ];
}