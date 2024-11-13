import { Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';

@Component({
  selector: 'jhi-liste-velo',
  standalone: true,
  imports: [ButtonModule, ToastModule, TableModule],
  templateUrl: './liste-velo.component.html',
  styleUrl: './liste-velo.component.scss',
})
export class ListeVeloComponent {
  constructor(private router: Router) {}

  test: any[] = ['a', 'b', 'c'];

  click() {
    console.log('click');
  }

  goToPage(pageName: string) {
    this.router.navigate([`${pageName}`]);
  }
}
