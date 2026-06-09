import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterReceptionist } from './register-receptionist';

describe('RegisterReceptionist', () => {
  let component: RegisterReceptionist;
  let fixture: ComponentFixture<RegisterReceptionist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterReceptionist],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterReceptionist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
