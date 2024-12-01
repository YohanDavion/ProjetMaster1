import { Component, OnInit } from '@angular/core';
import { AccountService } from 'app/core/auth/account.service';
import { TourneeService } from 'app/tournee/tournee.service';
import { PointInteret } from 'app/arret.service';

@Component({
  selector: 'app-velo-home',
  templateUrl: './velo-home.component.html',
  styleUrls: ['./velo-home.component.scss'],
})
export class VeloHomeComponent implements OnInit {
  tournees: PointInteret[][] = [];

  constructor(
    private accountService: AccountService,
    private tourneeService: TourneeService,
  ) {}

  ngOnInit(): void {
    // Récupérer l'utilisateur connecté
    this.accountService.identity().subscribe(account => {
      if (account && account.veloId) {
        // Charger les tournées assignées au vélo de l'utilisateur
        this.tournees = this.tourneeService.getTourneesForVelo(account.veloId);
      }
    });
  }
}
