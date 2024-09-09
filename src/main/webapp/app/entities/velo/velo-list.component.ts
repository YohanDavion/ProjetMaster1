import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { VeloService } from '../../core/services/velo.service';
import { Velo } from '../velo.model';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Subject } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-velo-list',
  templateUrl: './velo-list.component.html',
  imports: [SharedModule, RouterModule, CardModule, ButtonModule],
})
export class VeloListComponent implements OnInit {
  velos: Velo[] = [];

  constructor(private veloService: VeloService) {}
  account = signal<Account | null>(null);
  private accountService = inject(AccountService);

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => this.account.set(account));

    this.loadAll();
  }

  loadAll(): void {
    this.veloService.getAll().subscribe(data => {
      console.log(data); // Pour voir les données dans la console
      this.velos = data;
    });
  }

  deleteVelo(id: number): void {
    this.veloService.delete(id).subscribe(() => {
      this.loadAll();
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
