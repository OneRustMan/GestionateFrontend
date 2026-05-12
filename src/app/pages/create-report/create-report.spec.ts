import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateReportComponent } from './create-report';
import { provideRouter } from '@angular/router';

describe('CreateReportComponent', () => {
  let component: CreateReportComponent;
  let fixture: ComponentFixture<CreateReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateReportComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not allow submission if fields are empty', () => {
    component.description = '';
    component.location = '';
    component.selectedIncidentType = '';
    
    spyOn(window, 'alert');
    component.onSubmit();
    
    expect(window.alert).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });

  it('should allow submission if fields are filled', () => {
    component.description = 'Test description';
    component.location = 'Test location';
    component.selectedIncidentType = 'Residuos orgánicos';
    
    component.onSubmit();
    
    expect(component.showModal).toBeTrue();
    expect(component.reportNumber).toBeTruthy();
    expect(component.reportDate).toBeTruthy();
  });
});
