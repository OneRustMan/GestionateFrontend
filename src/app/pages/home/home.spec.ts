import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { ReceptionService } from '../../services/reception.service';
import { WorkOrderService } from '../../services/work-order.service';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAuthService: any;
  let mockReportService: any;
  let mockReceptionService: any;
  let mockWorkOrderService: any;

  beforeEach(async () => {
    mockAuthService = {
      getCitizenId: () => 1,
      getRole: () => 'CITIZEN',
      getCleaningStaffId: () => 1,
      getProfileId: () => 1
    };
    mockReportService = {
      getCitizenHistory: () => of([])
    };
    mockReceptionService = {
      getInboxReports: () => of([])
    };
    mockWorkOrderService = {
      getAvailable: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { params: of({}) }
        },
        {
          provide: AuthService,
          useValue: mockAuthService
        },
        {
          provide: ReportService,
          useValue: mockReportService
        },
        {
          provide: ReceptionService,
          useValue: mockReceptionService
        },
        {
          provide: WorkOrderService,
          useValue: mockWorkOrderService
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
