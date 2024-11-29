import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeloTourneeComponent } from './velo-tournee.component';

describe('VeloTourneeComponent', () => {
  let component: VeloTourneeComponent;
  let fixture: ComponentFixture<VeloTourneeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeloTourneeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VeloTourneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
