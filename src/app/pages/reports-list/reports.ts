import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, NavigationEnd } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs/operators";
import { AuthService } from "../../services/auth.service";
import { ReceptionService } from "../../services/reception.service";
import { ReportService } from "../../services/report.service";
import { WorkOrderService } from "../../services/work-order.service";
import { ReportSummary } from "../../models/report.models";
import { WorkOrderSummary } from "../../models/work-order.models";

interface ViewItem {
  numericId: number;
  id: string;
  tipo: string;
  lugar: string;
  fecha: string;
  estado: string;
  description: string;
}

@Component({
  selector: "app-reports",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./reports.html",
  styleUrls: ["./reports.css"]
})
export class ReportsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  currentUserRole = "ciudadano";
  currentView = "ciudadano-mis-reportes";
  showCoordinarForm = false;
  showDenegarForm = false;
  isLoading = false;
  errorMessage = "";

  reportsList: ViewItem[] = [];
  selectedReport: ViewItem | null = null;

  currentPage = 1;
  pageSize = 3;

  get totalPages(): number {
    return Math.ceil(this.reportsList.length / this.pageSize);
  }

  get paginatedReportsList(): ViewItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.reportsList.slice(startIndex, startIndex + this.pageSize);
  }

  get pagesArray(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly reportService: ReportService,
    private readonly receptionService: ReceptionService,
    private readonly workOrderService: WorkOrderService,
  ) {}

  ngOnInit() {
    this.determinarRolPorUrl(this.router.url);
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      this.determinarRolPorUrl((event as NavigationEnd).urlAfterRedirects);
    });
  }

  determinarRolPorUrl(url: string) {
    this.selectedReport = null;
    this.showCoordinarForm = false;
    this.showDenegarForm = false;

    if (url.includes("reportes-recibidos")) {
      this.currentUserRole = "recepcionista";
      this.currentView = "recepcionista-recibidos";
    } else if (url.includes("reportes-derivados")) {
      this.currentUserRole = "recepcionista";
      this.currentView = "recepcionista-derivados";
    } else if (url.includes("ordenes-asignadas")) {
      this.currentUserRole = "operativo";
      this.currentView = "operativo-asignadas";
    } else if (url.includes("ordenes-completadas")) {
      this.currentUserRole = "operativo";
      this.currentView = "operativo-completadas";
    } else {
      this.currentUserRole = "ciudadano";
      this.currentView = "ciudadano-mis-reportes";
    }

    this.loadItems();
  }

  selectReport(report: ViewItem) {
    this.selectedReport = report;
    this.showCoordinarForm = false;
    this.showDenegarForm = false;
  }

  derivar() {
    const receptionistId = this.authService.getReceptionistId();
    if (!this.selectedReport || !receptionistId) return;

    this.receptionService.deriveReport(this.selectedReport.numericId, receptionistId, { priority: "MEDIUM" }).subscribe({
      next: () => {
        if (this.selectedReport) {
          this.selectedReport.estado = "Derivado";
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = "No se pudo derivar el reporte.";
        this.cdr.detectChanges();
      },
    });
  }

  abrirFormularioDenegar() {
    this.showDenegarForm = true;
  }

  confirmarDenegacion() {
    this.showDenegarForm = false;
  }

  abrirFormularioCoordinar() {
    this.showCoordinarForm = true;
  }

  confirmarCoordinacion() {
    const cleaningStaffId = this.authService.getCleaningStaffId();
    if (!this.selectedReport || !cleaningStaffId) return;

    this.workOrderService.take(this.selectedReport.numericId, cleaningStaffId).subscribe({
      next: () => {
        if (this.selectedReport) {
          this.selectedReport.estado = "En Proceso";
        }
        this.showCoordinarForm = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = "No se pudo tomar la orden.";
        this.cdr.detectChanges();
      },
    });
  }

  registrarInforme() {
    const cleaningStaffId = this.authService.getCleaningStaffId();
    if (!this.selectedReport || !cleaningStaffId) return;

    this.workOrderService.complete(this.selectedReport.numericId, cleaningStaffId, {
      observation: "La incidencia fue atendida correctamente.",
    }).subscribe({
      next: () => {
        if (this.selectedReport) {
          this.selectedReport.estado = "Completado";
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = "No se pudo completar la orden.";
        this.cdr.detectChanges();
      },
    });
  }

  private loadItems(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.cdr.detectChanges();

    if (this.currentUserRole === "ciudadano") {
      const citizenId = this.authService.getCitizenId();
      if (!citizenId) {
        this.finishLoad([]);
        return;
      }

      this.reportService.getCitizenHistory(citizenId).subscribe({
        next: (reports) => this.finishLoad(reports.map((report) => this.mapReport(report))),
        error: () => this.failLoad("No se pudieron cargar los reportes."),
      });
      return;
    }

    if (this.currentUserRole === "recepcionista") {
      const receptionistId = this.authService.getReceptionistId();
      if (!receptionistId) {
        this.finishLoad([]);
        return;
      }

      this.receptionService.getInbox(receptionistId).subscribe({
        next: (reports) => this.finishLoad(reports.map((report) => this.mapReport(report))),
        error: () => this.failLoad("No se pudieron cargar los reportes de recepcion."),
      });
      return;
    }

    const cleaningStaffId = this.authService.getCleaningStaffId();
    if (!cleaningStaffId) {
      this.finishLoad([]);
      return;
    }

    this.workOrderService.getAvailable(cleaningStaffId).subscribe({
      next: (orders) => this.finishLoad(orders.map((order) => this.mapWorkOrder(order))),
      error: () => this.failLoad("No se pudieron cargar las ordenes."),
    });
  }

  private finishLoad(items: ViewItem[]): void {
    this.reportsList = items;
    this.currentPage = 1;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private failLoad(message: string): void {
    this.reportsList = [];
    this.currentPage = 1;
    this.errorMessage = message;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private mapReport(report: ReportSummary): ViewItem {
    return {
      numericId: report.id,
      id: report.reportCode || "#" + report.id,
      tipo: report.incidentTypes?.join(", ") || "Incidente",
      lugar: report.location,
      fecha: this.formatDate(report.createdAt),
      estado: this.mapStatus(report.status),
      description: report.description,
    };
  }

  private mapWorkOrder(order: WorkOrderSummary): ViewItem {
    return {
      numericId: order.id,
      id: "#" + order.id,
      tipo: String(order.priority),
      lugar: "Orden de trabajo",
      fecha: this.formatDate(order.createdAt),
      estado: this.mapStatus(order.status),
      description: "Orden asociada al reporte #" + order.reportId,
    };
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      RECEIVED: "Recibido",
      DERIVED: "Derivado",
      ORDER_COMPLETED: "Completado",
      PENDING: "Pendiente de Recepción",
      IN_PROGRESS: "En Proceso",
      COMPLETED: "Completado",
    };

    return statusMap[status] || status;
  }

  private formatDate(value?: string): string {
    if (!value) return "-";
    return new Intl.DateTimeFormat("es-PE").format(new Date(value));
  }
}
