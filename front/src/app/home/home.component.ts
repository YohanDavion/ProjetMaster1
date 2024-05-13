import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { NavBarComponent } from '../composants/nav-bar/nav-bar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavBarComponent,CardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent {
  constructor() { };

  ngOnInit(): void {
  }
}
