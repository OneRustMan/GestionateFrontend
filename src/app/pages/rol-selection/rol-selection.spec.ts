import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolSelection } from './rol-selection';

describe('RolSelection', () => {
  let component: RolSelection;
  let fixture: ComponentFixture<RolSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolSelection],
    }).compileComponents();

    fixture = TestBed.createComponent(RolSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
