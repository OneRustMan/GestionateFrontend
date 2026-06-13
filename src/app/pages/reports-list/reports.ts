import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { Router, NavigationEnd } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, finalize } from "rxjs/operators";
import { AuthService } from "../../services/auth.service";
import { ReceptionService } from "../../services/reception.service";
import { IncidentTypeService } from "../../services/incident-type.service";
import { ReportService } from "../../services/report.service";
import { WorkOrderService } from "../../services/work-order.service";
import { EvidenceResponse, IncidentTypeResponse, LocationResponse, ReceptionReportDetailResponse, ReceptionReportInboxResponse, ReportResponse, ReportSummary } from "../../models/report.models";
import { WorkOrderDetailResponse, WorkOrderPriority, WorkOrderResponse } from "../../models/work-order.models";

interface ViewItem {
  numericId: number;
  id: string;
  tipo: string;
  lugar: string;
  fecha: string;
  estado: string;
  description: string;
  citizenFullName?: string;
  createdAt?: string;
  priority?: WorkOrderPriority;
  priorityLabel?: string;
  reportCode?: string;
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
  selectedReportDetail: ReportResponse | null = null;
  selectedReceptionReportDetail: ReceptionReportDetailResponse | null = null;
  selectedWorkOrderDetail: WorkOrderDetailResponse | null = null;
  detailLoading = false;
  detailError = "";

  currentPage = 1;
  pageSize = 3;

  selectedOrder = "recent";
  selectedStatus = "all";
  selectedIncidentTypeId: number | null = null;
  incidentTypes: IncidentTypeResponse[] = [];
  selectedPriorityFilter = "all";
  selectedPriority: WorkOrderPriority | "" = "";
  deriveLoading = false;
  deriveError = "";
  deriveSuccess = "";
  takeLoading = false;
  takeError = "";
  takeSuccess = "";
  searchTerm = "";

  get filteredReportsList(): ViewItem[] {
    let list = [...this.reportsList];

    // 1. Búsqueda por texto
    if (this.searchTerm.trim() !== "") {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(item =>
        item.id.toLowerCase().includes(term) ||
        (item.reportCode || "").toLowerCase().includes(term) ||
        (item.citizenFullName || "").toLowerCase().includes(term) ||
        item.tipo.toLowerCase().includes(term) ||
        item.lugar.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.estado.toLowerCase().includes(term) ||
        (item.priorityLabel || "").toLowerCase().includes(term)
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
    }

    // 3. Filtrar por prioridad
    if (this.currentUserRole === "operativo" && !this.isWorkOrderListView() && this.selectedPriorityFilter !== "all") {
      list = list.filter(item => {
        const itemPriority = item.priority || "";
        const targetPriority = this.getSelectedPriorityParam() || "";
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
        this.clearReportDetail();
        this.clearDeriveState();
        this.clearTakeState();
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

  onIncidentTypeFilterChange(incidentTypeId: number | null): void {
    this.selectedIncidentTypeId = incidentTypeId;
    this.currentPage = 1;
    this.selectedReport = null;
    this.clearReportDetail();
    this.clearDeriveState();
    this.loadItems();
  }

  isWorkOrderListView(): boolean {
    return this.currentView === "operativo-asignadas" || this.currentView === "operativo-completadas";
  }

  changePriority(priority: string) {
    this.selectedPriorityFilter = priority;
    this.currentPage = 1;

    if (this.isWorkOrderListView()) {
      this.selectedReport = null;
      this.clearReportDetail();
      this.clearDeriveState();
      this.clearTakeState();
      this.loadItems();
      return;
    }

    this.verifySelectedReport();
    this.cdr.detectChanges();
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.currentPage = 1;

    if (this.isWorkOrderListView()) {
      this.selectedReport = null;
      this.clearReportDetail();
      this.clearDeriveState();
      this.clearTakeState();
      this.cdr.detectChanges();
      return;
    }

    this.verifySelectedReport();
    if (!this.selectedReport) {
      this.clearDeriveState();
    }
    this.cdr.detectChanges();
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly reportService: ReportService,
    private readonly receptionService: ReceptionService,
    private readonly incidentTypeService: IncidentTypeService,
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
    this.clearReportDetail();
    this.clearDeriveState();
    this.clearTakeState();
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

    if (this.currentUserRole === "recepcionista" && this.incidentTypes.length === 0) {
      this.loadIncidentTypes();
    }

    this.loadItems();
  }

  selectReport(report: ViewItem) {
    this.selectedReport = report;
    this.showCoordinarForm = false;
    this.showDenegarForm = false;
    this.clearReportDetail();
    this.clearDeriveState();
    this.clearTakeState();

    if (this.currentView === "ciudadano-mis-reportes") {
      this.loadCitizenReportDetail(report);
      return;
    }

    if (this.currentView === "recepcionista-recibidos" || this.currentView === "recepcionista-derivados") {
      this.loadReceptionReportDetail(report);
      return;
    }

    if (this.isWorkOrderListView()) {
      this.loadWorkOrderDetail(report);
    }
  }

  private loadCitizenReportDetail(report: ViewItem): void {
    const citizenId = this.authService.getProfileId();

    if (this.authService.getRole() !== "CITIZEN" || !citizenId) {
      void this.router.navigate(["/login"]);
      return;
    }

    if (!report.numericId) {
      this.detailError = "Reporte no encontrado.";
      return;
    }

    const selectedReportId = report.numericId;
    this.detailLoading = true;
    this.detailError = "";

    this.reportService.getCitizenReportDetail(citizenId, selectedReportId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (detail) => {
        if (this.selectedReport?.numericId !== selectedReportId) return;
        this.selectedReportDetail = detail;
        this.detailLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        if (this.selectedReport?.numericId !== selectedReportId) return;
        this.detailLoading = false;

        if (error.status === 404) {
          this.detailError = "Reporte no encontrado.";
        } else if (error.status === 401 || error.status === 403) {
          this.authService.clearSession();
          void this.router.navigate(["/login"]);
        } else {
          this.detailError = "No se pudo cargar el detalle del reporte.";
        }

        this.cdr.detectChanges();
      },
    });
  }

  private loadReceptionReportDetail(report: ViewItem): void {
    const receptionistId = this.authService.getProfileId();

    if (this.authService.getRole() !== "MUNICIPAL_RECEPTIONIST" || !receptionistId) {
      void this.router.navigate(["/home"]);
      return;
    }

    if (!report.numericId) {
      this.detailError = "El reporte ya no está disponible";
      return;
    }

    const selectedReportId = report.numericId;
    this.detailLoading = true;
    this.detailError = "";

    this.receptionService.getReportDetail(receptionistId, selectedReportId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (detail) => {
        if (this.selectedReport?.numericId !== selectedReportId) return;
        this.selectedReceptionReportDetail = detail;
        this.detailLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        if (this.selectedReport?.numericId !== selectedReportId) return;
        this.detailLoading = false;

        if (error.status === 404) {
          this.detailError = "El reporte ya no está disponible";
        } else if (error.status === 401 || error.status === 403) {
          this.authService.clearSession();
          void this.router.navigate(["/login"]);
        } else {
          this.detailError = "No se pudo cargar el detalle del reporte.";
        }

        this.cdr.detectChanges();
      },
    });
  }

  private loadWorkOrderDetail(report: ViewItem): void {
    const cleaningStaffId = this.authService.getProfileId();

    if (this.authService.getRole() !== "CLEANING_OPERATIONS" || !cleaningStaffId) {
      void this.router.navigate(["/home"]);
      return;
    }

    if (!report.numericId) {
      this.detailError = "La orden ya no está disponible";
      return;
    }

    const selectedWorkOrderId = report.numericId;
    this.detailLoading = true;
    this.detailError = "";

    this.workOrderService.getWorkOrderDetail(cleaningStaffId, selectedWorkOrderId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (detail) => {
        if (this.selectedReport?.numericId !== selectedWorkOrderId) return;
        this.selectedWorkOrderDetail = detail;
        this.detailLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        if (this.selectedReport?.numericId !== selectedWorkOrderId) return;
        this.detailLoading = false;

        if (error.status === 401 || error.status === 403) {
          this.authService.clearSession();
          void this.router.navigate(["/login"]);
        } else {
          this.detailError = this.getWorkOrderDetailErrorMessage(error);
        }

        this.cdr.detectChanges();
      },
    });
  }

  private getWorkOrderDetailErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return "La orden ya no está disponible";
    }

    if (error.status === 400) {
      return this.getBackendErrorText(error) || "La orden requiere ubicación para ser atendida";
    }

    return "No se pudo cargar el detalle de la orden.";
  }

  get canShowDeriveSection(): boolean {
    return this.currentView === "recepcionista-recibidos"
      && this.selectedReceptionReportDetail?.status === "RECEIVED";
  }

  onDerivePriorityChange(priority: WorkOrderPriority): void {
    this.selectedPriority = priority;
    this.deriveError = "";
    this.deriveSuccess = "";
  }

  derivar(): void {
    this.deriveError = "";
    this.deriveSuccess = "";

    if (!this.selectedPriority) {
      this.deriveError = "Selecciona una prioridad para continuar";
      this.cdr.detectChanges();
      return;
    }

    const receptionistId = this.authService.getProfileId();
    const reportId = this.selectedReceptionReportDetail?.reportId ?? this.selectedReport?.numericId;

    if (this.authService.getRole() !== "MUNICIPAL_RECEPTIONIST" || !receptionistId || !reportId || !this.canShowDeriveSection) {
      return;
    }

    this.deriveLoading = true;

    this.receptionService.deriveReport(receptionistId, reportId, { priority: this.selectedPriority }).pipe(
      finalize(() => {
        this.deriveLoading = false;
        this.cdr.detectChanges();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.deriveSuccess = "Reporte derivado correctamente";
        this.selectedReport = null;
        this.selectedPriority = "";
        this.clearReportDetail();
        this.loadItems();
      },
      error: (error: HttpErrorResponse) => {
        this.deriveError = this.getDeriveErrorMessage(error);
        this.cdr.detectChanges();
      },
    });
  }

  private getDeriveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return "El reporte ya no está disponible";
    }

    if (error.status === 400) {
      const message = this.getBackendErrorText(error).toLowerCase();
      if (message.includes("prior")) {
        return "Selecciona una prioridad para continuar";
      }
      return "El reporte ya fue derivado";
    }

    return "No se pudo derivar el reporte. Inténtalo nuevamente.";
  }

  get canShowTakeSection(): boolean {
    return this.currentView === "operativo-asignadas"
      && this.selectedWorkOrderDetail?.workOrderStatus === "PENDING";
  }

  takeSelectedWorkOrder(): void {
    this.takeError = "";
    this.takeSuccess = "";

    const detail = this.selectedWorkOrderDetail;
    if (!detail || detail.workOrderStatus !== "PENDING") {
      return;
    }

    const cleaningStaffId = this.authService.getProfileId();
    const workOrderId = detail.workOrderId;

    if (this.authService.getRole() !== "CLEANING_OPERATIONS" || !cleaningStaffId || !workOrderId) {
      void this.router.navigate(["/home"]);
      return;
    }

    this.takeLoading = true;

    this.workOrderService.takeWorkOrder(cleaningStaffId, workOrderId).pipe(
      finalize(() => {
        this.takeLoading = false;
        this.cdr.detectChanges();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.takeSuccess = "Orden tomada correctamente";
        this.selectedWorkOrderDetail = {
          ...detail,
          workOrderStatus: response.workOrderStatus,
        };

        if (this.selectedReport?.numericId === workOrderId) {
          this.selectedReport.estado = this.getWorkOrderStatusLabel(response.workOrderStatus);
        }

        this.loadItems();
      },
      error: (error: HttpErrorResponse) => {
        this.takeError = this.getTakeWorkOrderErrorMessage(error);
        this.cdr.detectChanges();
      },
    });
  }

  private getTakeWorkOrderErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return "La orden ya fue asignada.";
    }

    if (error.status === 404) {
      return "La orden ya no está disponible.";
    }

    if (error.status === 401 || error.status === 403) {
      this.authService.clearSession();
      void this.router.navigate(["/login"]);
    }

    return "No se pudo tomar la orden. Inténtalo nuevamente.";
  }

  private getBackendErrorText(error: HttpErrorResponse): string {
    if (typeof error.error === "string") {
      return error.error.trim();
    }

    const backendMessage = [
      error.error?.message,
      error.error?.error,
      error.error?.detail,
    ].filter(Boolean).join(" ").trim();

    return backendMessage;
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
      const receptionistId = this.authService.getProfileId();
      if (this.authService.getRole() !== "MUNICIPAL_RECEPTIONIST" || !receptionistId) {
        this.failLoad("Acceso denegado.");
        void this.router.navigate(["/home"]);
        return;
      }

      const incidentTypeId = this.selectedIncidentTypeId ?? undefined;
      const reportsRequest = this.currentView === "recepcionista-derivados"
        ? this.receptionService.getDerivedReports(receptionistId, incidentTypeId)
        : this.receptionService.getInboxReports(receptionistId, incidentTypeId);

      reportsRequest.subscribe({
        next: (reports) => this.finishLoad(reports.map((report) => this.mapReceptionInboxReport(report))),
        error: (error: HttpErrorResponse) => this.handleReceptionReportsError(error),
      });
      return;
    }

    if (this.currentView === "operativo-asignadas") {
      const cleaningStaffId = this.authService.getProfileId();
      if (this.authService.getRole() !== "CLEANING_OPERATIONS" || !cleaningStaffId) {
        this.failLoad("Acceso denegado.");
        void this.router.navigate(["/home"]);
        return;
      }

      this.workOrderService.getAvailableWorkOrders(cleaningStaffId, this.getSelectedPriorityParam()).subscribe({
        next: (orders) => this.finishLoad(orders.map((order) => this.mapWorkOrder(order))),
        error: (error: HttpErrorResponse) => this.handleWorkOrdersError(error),
      });
      return;
    }

    if (this.currentView === "operativo-completadas") {
      const cleaningStaffId = this.authService.getProfileId();
      if (this.authService.getRole() !== "CLEANING_OPERATIONS" || !cleaningStaffId) {
        this.failLoad("Acceso denegado.");
        void this.router.navigate(["/home"]);
        return;
      }

      this.workOrderService.getCompletedWorkOrders(cleaningStaffId, this.getSelectedPriorityParam()).subscribe({
        next: (orders) => this.finishLoad(orders.map((order) => this.mapWorkOrder(order))),
        error: (error: HttpErrorResponse) => this.handleWorkOrdersError(error),
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
      lugar: this.getLocationLabel(report),
      fecha: this.formatDate(report.createdAt),
      estado: this.getStatusLabel(report.status),
      description: report.description || "-",
      createdAt: report.createdAt,
    };
  }

  private mapReceptionInboxReport(report: ReceptionReportInboxResponse): ViewItem {
    return {
      numericId: report.reportId,
      id: report.reportCode || "#" + report.reportId,
      tipo: this.getIncidentTypesLabel(report),
      lugar: this.formatLocation(report.location),
      fecha: this.formatDate(report.createdAt),
      estado: this.getStatusLabel(report.status),
      description: report.description || "-",
      citizenFullName: report.citizenFullName || "Ciudadano no disponible",
      createdAt: report.createdAt,
    };
  }

  private getSelectedPriorityParam(): WorkOrderPriority | undefined {
    const priorityMap: Record<string, WorkOrderPriority> = {
      Alta: "HIGH",
      Media: "MEDIUM",
      Baja: "LOW",
    };

    return priorityMap[this.selectedPriorityFilter];
  }

  getPriorityLabel(priority: WorkOrderPriority | string): string {
    const priorityMap: Record<string, string> = {
      LOW: "Baja",
      MEDIUM: "Media",
      HIGH: "Alta",
    };

    return priorityMap[priority] || priority || "-";
  }

  getWorkOrderStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: "Pendiente",
      IN_PROGRESS: "En progreso",
      PARTIAL_ATTENTION: "Atención parcial",
      COMPLETED: "Completada",
    };

    return statusMap[status] || status || "-";
  }

  private getStatusFilterParam(): string | undefined {
    const statusMap: Record<string, string> = {
      Recibido: "RECEIVED",
      Derivado: "DERIVED",
      Completado: "ORDER_COMPLETED",
    };

    return statusMap[this.selectedStatus];
  }

  getIncidentTypesLabel(report: ReportResponse | ReportSummary | ReceptionReportInboxResponse | ReceptionReportDetailResponse | WorkOrderResponse | WorkOrderDetailResponse): string {
    const incidentTypes = report.incidentTypes || [];
    const labels = incidentTypes
      .map((type) => this.getIncidentTypeLabel(type))
      .filter((label) => label.length > 0);

    return labels.length > 0 ? labels.join(", ") : "Sin tipo de incidencia";
  }

  getIncidentTypeLabel(type: string | IncidentTypeResponse): string {
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

  getLocationLabel(report: ReportResponse | ReportSummary | ReceptionReportInboxResponse | ReceptionReportDetailResponse | WorkOrderResponse | WorkOrderDetailResponse): string {
    return this.formatLocation(report.location);
  }

  getLocationText(location: LocationResponse | null): string {
    return this.formatLocation(location);
  }

  getVisualEvidences(evidences: EvidenceResponse[] | null | undefined): EvidenceResponse[] {
    return (evidences ?? []).filter((evidence) => Boolean(evidence.fileUrl));
  }

  getEvidenceUrl(evidence: EvidenceResponse): string | null {
    return evidence.fileUrl || null;
  }

  getEvidenceLabel(evidence: EvidenceResponse): string {
    return "Evidencia " + evidence.id;
  }

  isStatusStepActive(status: string, step: "RECEIVED" | "DERIVED" | "ORDER_COMPLETED"): boolean {
    const statusOrder: Record<string, number> = {
      RECEIVED: 1,
      DERIVED: 2,
      ORDER_COMPLETED: 3,
    };

    return (statusOrder[status] || 0) >= statusOrder[step];
  }

  private clearDeriveState(clearSuccess = true): void {
    this.selectedPriority = "";
    this.deriveLoading = false;
    this.deriveError = "";
    if (clearSuccess) {
      this.deriveSuccess = "";
    }
  }

  private clearTakeState(): void {
    this.takeLoading = false;
    this.takeError = "";
    this.takeSuccess = "";
  }

  clearReportDetail(): void {
    this.selectedReportDetail = null;
    this.selectedReceptionReportDetail = null;
    this.selectedWorkOrderDetail = null;
    this.detailLoading = false;
    this.detailError = "";
  }

  private formatLocation(location: string | LocationResponse | null | undefined): string {
    if (!location) return "Ubicación no disponible";
    if (typeof location === "string") return location || "Ubicación no disponible";

    const address = location.addressReference || "";
    const area = [location.districtName, location.province].filter(Boolean).join(", ");

    if (address && area) return address + " - " + area;
    return address || area || "Ubicación no disponible";
  }

  private mapWorkOrder(order: WorkOrderResponse): ViewItem {
    return {
      numericId: order.workOrderId,
      id: order.orderCode || "Orden #" + order.workOrderId,
      tipo: this.getIncidentTypesLabel(order),
      lugar: this.getLocationLabel(order),
      fecha: this.formatDate(order.createdAt),
      estado: this.getWorkOrderStatusLabel(order.workOrderStatus),
      description: order.description || "-",
      createdAt: order.createdAt,
      priority: order.priority,
      priorityLabel: this.getPriorityLabel(order.priority),
      reportCode: order.reportCode || "#" + order.reportId,
    };
  }

  private loadIncidentTypes(): void {
    this.incidentTypeService.getIncidentTypes().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (incidentTypes) => {
        this.incidentTypes = incidentTypes.filter((type) => type.active);
        this.cdr.detectChanges();
      },
      error: () => {
        this.incidentTypes = [];
        this.cdr.detectChanges();
      },
    });
  }

  private handleReceptionReportsError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      this.failLoad("Acceso denegado.");
      void this.router.navigate(["/home"]);
      return;
    }

    this.failLoad(this.currentView === "recepcionista-derivados"
      ? "No se pudieron cargar los reportes derivados."
      : "No se pudieron cargar los reportes recibidos.");
  }

  private handleWorkOrdersError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      this.failLoad("Acceso denegado.");
      void this.router.navigate(["/home"]);
      return;
    }

    this.failLoad("No se pudieron cargar las órdenes asignadas.");
  }

  private handleCitizenHistoryError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      this.failLoad("Debes iniciar sesión para ver tu historial de reportes.");
      void this.router.navigate(["/login"]);
      return;
    }

    this.failLoad("No se pudo cargar el historial de reportes.");
  }

  getEmptyStateMessage(): string {
    if (this.currentView === "recepcionista-recibidos" && this.reportsList.length === 0 && !this.searchTerm.trim()) {
      return this.selectedIncidentTypeId
        ? "No hay reportes pendientes para este tipo de incidencia"
        : "No hay reportes pendientes";
    }

    if (this.currentView === "recepcionista-derivados" && this.reportsList.length === 0 && !this.searchTerm.trim()) {
      return this.selectedIncidentTypeId
        ? "No hay reportes derivados para este tipo de incidencia"
        : "No hay reportes derivados";
    }

    if (this.currentUserRole === "ciudadano" && this.reportsList.length === 0 && this.selectedStatus === "all" && !this.searchTerm.trim()) {
      return "Aún no tienes reportes registrados";
    }

    if (this.isWorkOrderListView() && this.reportsList.length === 0 && !this.searchTerm.trim()) {
      if (this.currentView === "operativo-completadas") {
        return this.selectedPriorityFilter === "all"
          ? "No hay órdenes completadas por ahora"
          : "No hay órdenes completadas para esta prioridad";
      }

      return this.selectedPriorityFilter === "all"
        ? "No hay órdenes asignadas por ahora"
        : "No hay órdenes asignadas para esta prioridad";
    }

    if (this.isWorkOrderListView()) {
      return "No se encontraron órdenes con los criterios seleccionados.";
    }

    return "No se encontraron reportes con los criterios seleccionados.";
  }

  getStatusLabel(status: string): string {
    return this.mapStatus(status);
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      RECEIVED: "Recibido",
      DERIVED: "Derivado",
      ORDER_COMPLETED: "Orden completada",
      PENDING: "Pendiente de Recepción",
      IN_PROGRESS: "En Proceso",
      COMPLETED: "Completado",
    };

    return statusMap[status] || status;
  }

  formatDate(value?: string): string {
    if (!value) return "-";
    return new Intl.DateTimeFormat("es-PE").format(new Date(value));
  }
}
