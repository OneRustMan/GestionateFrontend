import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterOperative } from './register-operative';

describe('RegisterOperative', () => {
  let component: RegisterOperative;
  let fixture: ComponentFixture<RegisterOperative>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterOperative],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterOperative);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
