import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { Router, NavigationEnd } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs/operators";
import { AuthService } from "../../services/auth.service";
import { ReceptionService } from "../../services/reception.service";
import { ReportService } from "../../services/report.service";
import { WorkOrderService } from "../../services/work-order.service";
import { IncidentTypeResponse, LocationResponse, ReportResponse, ReportSummary } from "../../models/report.models";
import { WorkOrderSummary } from "../../models/work-order.models";

interface ViewItem {
  numericId: number;
  id: string;
  tipo: string;
  lugar: string;
  fecha: string;
  estado: string;
  description: string;
  createdAt?: string;
  priority?: string;
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

  selectedOrder = "recent";
  selectedStatus = "all";
  selectedPriority = "all";
  searchTerm = "";

  get filteredReportsList(): ViewItem[] {
    let list = [...this.reportsList];

    // 1. Búsqueda por texto
    if (this.searchTerm.trim() !== "") {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(item => 
        item.id.toLowerCase().includes(term) ||
        item.tipo.toLowerCase().includes(term) ||
        item.lugar.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.estado.toLowerCase().includes(term)
      );
    }

    // 2. Filtrar por estado
    if (this.currentUserRole === "ciudadano" && this.selectedStatus !== "all") {
      list = list.filter(item => {
        if (this.selectedStatus === "Recibido") {
          return item.estado === "Recibido" || item.estado === "Pendiente de Recepción";
        }
        if (this.selectedStatus === "Derivado") {
          return item.estado === "Derivado" || item.estado === "En Proceso";
        }
        if (this.selectedStatus === "Completado") {
          return item.estado === "Completado";
        }
        return true;
      });
    } else if (this.currentUserRole === "recepcionista" && this.selectedStatus !== "all") {
      list = list.filter(item => {
        if (this.selectedStatus === "Recibido") {
          return item.estado === "Recibido" || item.estado === "Pendiente de Recepción";
        }
        return true;
      });
    }

    // 3. Filtrar por prioridad
    if (this.currentUserRole === "operativo" && this.selectedPriority !== "all") {
      list = list.filter(item => {
        const itemPriority = item.priority || "";
        const targetPriority = this.selectedPriority === "Alta" ? "HIGH" :
                               this.selectedPriority === "Media" ? "MEDIUM" :
                               this.selectedPriority === "Baja" ? "LOW" : "";
        return itemPriority.toUpperCase() === targetPriority;
      });
    }

    // 4. Ordenar por fecha
    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (this.selectedOrder === "recent") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return list;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReportsList.length / this.pageSize);
  }

  get paginatedReportsList(): ViewItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredReportsList.slice(startIndex, startIndex + this.pageSize);
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

  private verifySelectedReport() {
    if (this.selectedReport) {
      const stillExists = this.filteredReportsList.some(item => item.numericId === this.selectedReport!.numericId);
      if (!stillExists) {
        this.selectedReport = null;
      }
    }
  }

  changeOrder(order: string) {
    this.selectedOrder = order;
    this.currentPage = 1;
    this.verifySelectedReport();
    this.cdr.detectChanges();
  }

  changeStatus(status: string) {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.verifySelectedReport();

    if (this.currentUserRole === "ciudadano") {
      this.loadItems();
      return;
    }

    this.cdr.detectChanges();
  }

  changePriority(priority: string) {
    this.selectedPriority = priority;
    this.currentPage = 1;
    this.verifySelectedReport();
    this.cdr.detectChanges();
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.currentPage = 1;
    this.verifySelectedReport();
    this.cdr.detectChanges();
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
      const citizenId = this.authService.getProfileId();
      const role = this.authService.getRole();

      if (!this.authService.getToken() || role !== "CITIZEN" || !citizenId) {
        this.failLoad("Debes iniciar sesión para ver tu historial de reportes.");
        void this.router.navigate(["/login"]);
        return;
      }

      this.reportService.getCitizenReportHistory(citizenId, this.getStatusFilterParam()).subscribe({
        next: (reports) => this.finishLoad(reports.map((report) => this.mapReport(report))),
        error: (error: HttpErrorResponse) => this.handleCitizenHistoryError(error),
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

  private mapReport(report: ReportResponse | ReportSummary): ViewItem {
    return {
      numericId: report.id,
      id: report.reportCode || "#" + report.id,
      tipo: this.getIncidentTypesLabel(report),
      lugar: this.getLocationLabel(report.location),
      fecha: this.formatDate(report.createdAt),
      estado: this.getStatusLabel(report.status),
      description: report.description || "-",
      createdAt: report.createdAt,
    };
  }

  private getStatusFilterParam(): string | undefined {
    const statusMap: Record<string, string> = {
      Recibido: "RECEIVED",
      Derivado: "DERIVED",
      Completado: "ORDER_COMPLETED",
    };

    return statusMap[this.selectedStatus];
  }

  private getIncidentTypesLabel(report: ReportResponse | ReportSummary): string {
    const incidentTypes = report.incidentTypes || [];
    const labels = incidentTypes
      .map((type) => this.getIncidentTypeLabel(type))
      .filter((label) => label.length > 0);

    return labels.length > 0 ? labels.join(", ") : "Incidente";
  }

  private getIncidentTypeLabel(type: string | IncidentTypeResponse): string {
    const name = typeof type === "string" ? type : type.name;
    const typeMap: Record<string, string> = {
      RESIDUOS_ORGANICOS: "Residuos orgánicos",
      DESMONTE_RESIDUOS_CONSTRUCCION: "Desmonte o residuos de construcción",
      RESIDUOS_PELIGROSOS_QUIMICOS: "Residuos peligrosos o químicos",
      MUEBLES_OBJETOS_VOLUMINOSOS: "Muebles u objetos voluminosos",
      RESIDUOS_COMERCIALES: "Residuos comerciales",
      RESIDUOS_AREAS_PUBLICAS_VERDES: "Residuos en áreas públicas o verdes",
      OTRO_TIPO_RESIDUO: "Otro tipo de residuo",
    };

    return typeMap[name] || name || "";
  }

  private getLocationLabel(location: string | LocationResponse | null | undefined): string {
    if (!location) return "-";
    if (typeof location === "string") return location;

    const address = location.addressReference || "";
    const area = [location.districtName, location.province].filter(Boolean).join(", ");

    if (address && area) return `${address} - ${area}`;
    return address || area || "-";
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
      createdAt: order.createdAt,
      priority: String(order.priority),
    };
  }

  private handleCitizenHistoryError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      this.failLoad("Debes iniciar sesión para ver tu historial de reportes.");
      void this.router.navigate(["/login"]);
      return;
    }

    this.failLoad("No se pudo cargar el historial de reportes.");
  }

  private getStatusLabel(status: string): string {
    return this.mapStatus(status);
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
