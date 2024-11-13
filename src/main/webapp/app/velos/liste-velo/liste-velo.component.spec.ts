import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeVeloComponent } from './liste-velo.component';

describe('ListeVeloComponent', () => {
  let component: ListeVeloComponent;
  let fixture: ComponentFixture<ListeVeloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeVeloComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeVeloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
