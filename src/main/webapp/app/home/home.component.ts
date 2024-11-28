import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { VeloService } from 'app/velo/velo.service';
import { IncidentService } from 'app/incident/incident.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [SharedModule, RouterModule, CardModule, ButtonModule],
})
export default class HomeComponent implements OnInit, OnDestroy {
  // Données récupérées
  nbVelos = 0; // Nombre total de vélos
  nbIncidents = 0; // Nombre total d'incidents

  account: Account | null = null;

  private readonly destroy$ = new Subject<void>();

  private accountService = inject(AccountService);
  private veloService = inject(VeloService); // Injecter le service Velo
  private incidentService = inject(IncidentService); // Injecter le service Incident
  private router = inject(Router);

  constructor() {}

  ngOnInit(): void {
    this.fetchAccount();
    this.loadDashboardData();
  }

  fetchAccount(): void {
    this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => (this.account = account));
  }

  loadDashboardData(): void {
    // Charger le nombre total de vélos
    this.veloService.getVelos().subscribe(velos => {
      this.nbVelos = velos.length;
    });

    // Charger le nombre total d'incidents
    this.incidentService.getAllIncidents().subscribe(incidents => {
      this.nbIncidents = incidents.length;
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToPage(pageName: string): void {
    this.router.navigate([`${pageName}`]);
  }
}
