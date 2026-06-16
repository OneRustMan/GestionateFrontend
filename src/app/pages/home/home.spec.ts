import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { ReceptionService } from '../../services/reception.service';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAuthService: any;
  let mockReportService: any;
  let mockReceptionService: any;

  beforeEach(async () => {
    mockAuthService = {
      getRole: () => "CITIZEN",
      getProfileId: () => 1,
      getCitizenId: () => 1,
      getCleaningStaffId: () => null
    };
    mockReportService = {
      getCitizenHistory: () => of([])
    };
    mockReceptionService = {
      getInboxReports: () => of([])
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
