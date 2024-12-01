import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeloHomeComponent } from './velo-home.component';

describe('VeloHomeComponent', () => {
  let component: VeloHomeComponent;
  let fixture: ComponentFixture<VeloHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeloHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VeloHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
