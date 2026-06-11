import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DistrictService } from '../../services/district.service';
import { IncidentTypeService } from '../../services/incident-type.service';
import { ReportService } from '../../services/report.service';
import { ReportResponse } from '../../models/report.models';
import { CreateReportComponent } from './create-report';

class ReportServiceMock {
  callCount = 0;
  lastFormData: FormData | null = null;

  createReport(formData: FormData): Observable<ReportResponse> {
    this.callCount++;
    this.lastFormData = formData;

    return of({} as ReportResponse);
  }
}

class RouterMock {
  lastCommands: unknown[] | null = null;

  navigate(commands: unknown[]): Promise<boolean> {
    this.lastCommands = commands;
    return Promise.resolve(true);
  }
}

describe('CreateReportComponent', () => {
  let component: CreateReportComponent;
  let fixture: ComponentFixture<CreateReportComponent>;
  let reportService: ReportServiceMock;
  let router: RouterMock;

  beforeEach(async () => {
    reportService = new ReportServiceMock();
    router = new RouterMock();

    await TestBed.configureTestingModule({
      imports: [CreateReportComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { getProfileId: () => 7 } },
        {
          provide: DistrictService,
          useValue: { getActiveDistricts: () => of([{ id: 1, name: 'SAN JUAN DE LURIGANCHO', province: 'LIMA', active: true }]) },
        },
        {
          provide: IncidentTypeService,
          useValue: { getIncidentTypes: () => of([{ id: 1, name: 'Residuos organicos', active: true }]) },
        },
        { provide: ReportService, useValue: reportService },
        { provide: Router, useValue: router },
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if required fields are empty', () => {
    component.description = '';
    component.addressReference = '';
    component.selectedIncidentTypeIds.clear();
    component.selectedFiles = [];
    
    component.onSubmit();
    
    expect(reportService.callCount).toBe(0);
    expect(component.errorMessage).toContain('Completa los datos obligatorios del reporte.');
    expect(component.showModal).toBe(false);
  });

  it('should submit FormData and navigate to citizen reports if required fields are filled', () => {
    component.description = 'Test description';
    component.selectedDistrictId = 1;
    component.addressReference = 'Test location';
    component.latitude = -12.1;
    component.longitude = -77.1;
    component.selectedIncidentTypeIds.add(1);
    component.selectedFiles = [new File(['photo'], 'photo.png', { type: 'image/png' })];
    
    component.onSubmit();
    
    expect(reportService.callCount).toBe(1);
    expect(reportService.lastFormData instanceof FormData).toBe(true);
    expect(component.isSubmitting).toBe(false);
    expect(router.lastCommands).toEqual(['/mis-reportes']);
  });
});
