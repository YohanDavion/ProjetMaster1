import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourneeComponent } from './tournee.component';

describe('TourneeComponent', () => {
  let component: TourneeComponent;
  let fixture: ComponentFixture<TourneeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourneeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TourneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
