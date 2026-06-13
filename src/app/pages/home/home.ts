import { Component, OnInit, DestroyRef, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, NavigationEnd, RouterLink } from "@angular/router";
import { filter, finalize } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../services/auth.service";
import { ReceptionService } from "../../services/reception.service";
import { ReportService } from "../../services/report.service";
import { WorkOrderService } from "../../services/work-order.service";
import { LocationResponse, ReceptionReportInboxResponse, ReportResponse } from "../../models/report.models";
import { WorkOrderResponse } from "../../models/work-order.models";

interface RecentReportItem {
  reportCode: string;
  description: string;
  location: string;
  orderCode?: string;
  priorityLabel?: string;
  statusLabel?: string;
  createdAt?: string;
}

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./home.html",
  styleUrls: ["./home.css"]
})
export class HomeComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  recentReports: RecentReportItem[] = [];
  isLoading = false;
  errorMessage = "";

  constructor(
    private readonly authService: AuthService,
    private readonly reportService: ReportService,
    private readonly receptionService: ReceptionService,
    private readonly workOrderService: WorkOrderService,
    private readonly router: Router
  ) { }

  get isReceptionist(): boolean {
    return this.authService.getRole() === "MUNICIPAL_RECEPTIONIST";
  }

  get isCleaningOperations(): boolean {
    return this.authService.getRole() === "CLEANING_OPERATIONS";
  }

  get primaryActionLabel(): string {
    if (this.isReceptionist) return "Reportes recibidos";
    if (this.isCleaningOperations) return "Órdenes asignadas";
    return "Crear Reporte";
  }

  get primaryActionLink(): string {
    if (this.isReceptionist) return "/reportes-recibidos";
    if (this.isCleaningOperations) return "/ordenes-asignadas";
    return "/crear-reporte";
  }

  get reportsTitle(): string {
    if (this.isReceptionist) return "Últimos reportes recibidos";
    if (this.isCleaningOperations) return "Últimas órdenes asignadas";
    return "Tus últimos reportes";
  }

  get emptyMessage(): string {
    if (this.isReceptionist) return "No hay reportes pendientes";
    if (this.isCleaningOperations) return "No hay órdenes asignadas por ahora";
    return "No tienes reportes registrados actualmente.";
  }

  get finalLinkLabel(): string {
    if (this.isReceptionist) return "Ver mis reportes recibidos";
    if (this.isCleaningOperations) return "Ver mis órdenes asignadas";
    return "Ver todos mis reportes";
  }

  get finalLinkRoute(): string {
    if (this.isReceptionist) return "/reportes-recibidos";
    if (this.isCleaningOperations) return "/ordenes-asignadas";
    return "/mis-reportes";
  }

  get loadingMessage(): string {
    return this.isCleaningOperations ? "Cargando órdenes..." : "Cargando reportes...";
  }

  get itemLocationLabel(): string {
    return this.isCleaningOperations ? "Referencia" : "Dirección";
  }

  get illustrationAlt(): string {
    return this.isCleaningOperations
      ? "Ilustración de órdenes asignadas"
      : "Ilustración de reporte en móvil";
  }

  ngOnInit(): void {
    this.loadRecentReports();

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      filter((event) => (event as NavigationEnd).urlAfterRedirects.split("?")[0] === "/home"),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.loadRecentReports();
    });
  }

  loadRecentReports(): void {
    if (this.isLoading) {
      return;
    }

    if (this.isReceptionist) {
      this.loadReceptionRecentReports();
      return;
    }

    if (this.isCleaningOperations) {
      this.loadCleaningRecentOrders();
      return;
    }

    this.loadCitizenRecentReports();
  }

  private loadCitizenRecentReports(): void {
    const citizenId = this.authService.getCitizenId();
    if (!citizenId) {
      this.recentReports = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.startLoading();

    this.reportService.getCitizenHistory(citizenId).pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (reports) => {
        this.recentReports = Array.isArray(reports)
          ? reports.slice(0, 2).map((report) => this.mapCitizenReport(report))
          : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = "No se pudieron cargar tus reportes recientes.";
        this.cdr.detectChanges();
      }
    });
  }

  private loadReceptionRecentReports(): void {
    const receptionistId = this.authService.getProfileId();
    if (this.authService.getRole() !== "MUNICIPAL_RECEPTIONIST" || !receptionistId) {
      this.recentReports = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.startLoading();

    this.receptionService.getInboxReports(receptionistId).pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (reports) => {
        this.recentReports = Array.isArray(reports)
          ? reports.slice(0, 2).map((report) => this.mapReceptionReport(report))
          : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = "No se pudieron cargar los reportes recibidos.";
        this.cdr.detectChanges();
      }
    });
  }

  private loadCleaningRecentOrders(): void {
    const cleaningStaffId = this.authService.getProfileId();
    if (this.authService.getRole() !== "CLEANING_OPERATIONS" || !cleaningStaffId) {
      this.recentReports = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.startLoading();

    this.workOrderService.getAvailableWorkOrders(cleaningStaffId).pipe(
      finalize(() => this.stopLoading())
    ).subscribe({
      next: (orders) => {
        this.recentReports = Array.isArray(orders)
          ? [...orders]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2)
              .map((order) => this.mapWorkOrder(order))
          : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = "No se pudieron cargar las órdenes asignadas.";
        this.cdr.detectChanges();
      }
    });
  }

  private startLoading(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.cdr.detectChanges();
  }

  private stopLoading(): void {
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private mapCitizenReport(report: ReportResponse): RecentReportItem {
    return {
      reportCode: report.reportCode || "#" + report.id,
      description: report.description || "",
      location: this.formatLocation(report.location),
    };
  }

  private mapReceptionReport(report: ReceptionReportInboxResponse): RecentReportItem {
    return {
      reportCode: report.reportCode || "#" + report.reportId,
      description: report.description || "",
      location: this.formatLocation(report.location),
    };
  }

  private mapWorkOrder(order: WorkOrderResponse): RecentReportItem {
    return {
      orderCode: order.orderCode || "Orden #" + order.workOrderId,
      reportCode: order.reportCode || "#" + order.reportId,
      description: order.description || "",
      location: this.formatLocation(order.location),
      priorityLabel: this.getPriorityLabel(order.priority),
      statusLabel: this.getWorkOrderStatusLabel(order.workOrderStatus),
      createdAt: order.createdAt,
    };
  }

  private getPriorityLabel(priority: string): string {
    const priorityMap: Record<string, string> = {
      LOW: "Baja",
      MEDIUM: "Media",
      HIGH: "Alta",
    };

    return priorityMap[priority] || priority || "-";
  }

  private getWorkOrderStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: "Pendiente",
      IN_PROGRESS: "En progreso",
    };

    return statusMap[status] || status || "-";
  }

  truncateDescription(desc?: string): string {
    if (!desc) return "";
    return desc.length > 80 ? desc.substring(0, 80) + "..." : desc;
  }

  getReportTitle(report: RecentReportItem): string {
    return this.isCleaningOperations
      ? "Orden: " + (report.orderCode || report.reportCode)
      : "Reporte " + report.reportCode;
  }

  private formatLocation(location: LocationResponse | string | null): string {
    if (!location) return "Ubicación no disponible";
    if (typeof location === "string") return location || "Ubicación no disponible";

    const address = location.addressReference || "";
    const area = [location.districtName, location.province].filter(Boolean).join(", ");

    if (address && area) return address + " - " + area;
    return address || area || "Ubicación no disponible";
  }
}
