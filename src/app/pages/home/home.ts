import { Component, OnInit, DestroyRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { ReportResponse } from '../../models/report.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  recentReports: ReportResponse[] = [];
  isLoading = false;
  errorMessage = "";

  constructor(
    private readonly authService: AuthService,
    private readonly reportService: ReportService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    console.log('HomeComponent: ngOnInit called.');
    this.loadRecentReports();

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      filter((event) => (event as NavigationEnd).urlAfterRedirects.split('?')[0] === '/home'),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      console.log('HomeComponent: NavigationEnd event received.', (event as NavigationEnd).urlAfterRedirects);
      this.loadRecentReports();
    });
  }

  loadRecentReports(): void {
    if (this.isLoading) {
      console.log('HomeComponent: loadRecentReports ignored because it is already loading.');
      return;
    }

    const citizenId = this.authService.getCitizenId();
    console.log('HomeComponent: loadRecentReports called. citizenId:', citizenId);
    if (!citizenId) {
      console.log('HomeComponent: No citizenId found. Skipping reports load.');
      this.recentReports = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.cdr.detectChanges();

    this.reportService.getCitizenHistory(citizenId).pipe(
      finalize(() => {
        this.isLoading = false;
        console.log('HomeComponent: Request finalized. isLoading set to false.');
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (reports) => {
        console.log('HomeComponent: Request success. Reports received:', reports);
        if (Array.isArray(reports)) {
          this.recentReports = reports.slice(0, 2);
        } else {
          this.recentReports = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('HomeComponent: Request error:', err);
        this.errorMessage = 'No se pudieron cargar tus reportes recientes.';
        this.cdr.detectChanges();
      }
    });
  }

  truncateDescription(desc?: string): string {
    if (!desc) return '';
    return desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
  }

  getReportTitle(report: ReportResponse): string {
    return `Reporte ${report.reportCode || '#' + report.id}`;
  }

  getReportLocation(report: ReportResponse): string {
    const loc = report.location as any;
    if (!loc) return '-';
    if (typeof loc === 'string') return loc;

    // Si loc es un objeto de tipo LocationResponse
    const parts = [];
    if (loc.addressReference) parts.push(loc.addressReference);
    if (loc.districtName) parts.push(loc.districtName);
    if (loc.province) parts.push(loc.province);

    return parts.length > 0 ? parts.join(', ') : '-';
  }
}
