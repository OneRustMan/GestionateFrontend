import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterCitizen } from './register-citizen';

describe('RegisterCitizen', () => {
  let component: RegisterCitizen;
  let fixture: ComponentFixture<RegisterCitizen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterCitizen],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterCitizen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
