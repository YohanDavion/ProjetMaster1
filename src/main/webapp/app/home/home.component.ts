import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';

@Component({
  standalone: true,
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class HomeComponent implements OnInit, OnDestroy {
  //Les données sont marquées en dur mais tqt je fais les appels back plus tard
  avancementTourne: number = 75;

  flotteVelos = {
    circulation: 120,
    horsCirculation: 30,
  };

  incidents = {
    accidentCorporel: 2,
    arretSupprime: 5,
    casseVelo: 3,
    arretBloque: 1,
    batterieVide: 4,
  };
  account = signal<Account | null>(null);

  private readonly destroy$ = new Subject<void>();

  private accountService = inject(AccountService);
  private router = inject(Router);

  constructor() {}

  ngOnInit(): void {
    this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => this.account.set(account));
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  modifierFlotte(): void {
    console.log('Modifier la flotte des vélos.');
    // Ici, vous pouvez ajouter la logique pour modifier les données de la flotte de vélos.
  }

  modifierIncident(type: string): void {
    console.log(`Modifier l'incident de type: ${type}`);
    // Ici, vous pouvez ajouter la logique pour modifier les incidents.
  }
}
