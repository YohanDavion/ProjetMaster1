import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteCalculatorComponent } from './route-calculator.component';

describe('RouteCalculatorComponent', () => {
  let component: RouteCalculatorComponent;
  let fixture: ComponentFixture<RouteCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteCalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
