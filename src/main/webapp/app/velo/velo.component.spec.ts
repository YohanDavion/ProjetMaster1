import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeloComponent } from './velo.component';

describe('VeloComponent', () => {
  let component: VeloComponent;
  let fixture: ComponentFixture<VeloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeloComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VeloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
