import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAuthService: any;
  let mockReportService: any;

  beforeEach(async () => {
    mockAuthService = {
      getCitizenId: () => 1
    };
    mockReportService = {
      getCitizenHistory: () => of([])
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
