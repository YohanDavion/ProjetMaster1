import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VeloService } from 'app/velo/velo.service';
import { ArretService, PointInteret } from 'app/arret.service';
import { Velo } from 'app/velo/velo.model';
import { CommonModule } from '@angular/common';
import { TourneeService } from 'app/tournee/tournee.service';

@Component({
  standalone: true,
  selector: 'app-tournees',
  imports: [CommonModule],
  templateUrl: './tournee.component.html',
  styleUrls: ['./tournee.component.scss'],
})
export class TourneeComponent implements OnInit {
  velos: Velo[] = [];
  arrets: PointInteret[] = [];
  tourneesLoaded: boolean = false;

  constructor(
    private veloService: VeloService,
    private arretService: ArretService,
    private router: Router,
    public tourneeService: TourneeService, // Pour utiliser dans le template
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    if (this.tourneesLoaded) {
      console.warn('Les tournées ont déjà été chargées.');
      return;
    }

    this.veloService.getVelosWithPosition().subscribe(velos => {
      this.velos = velos;

      this.arretService.getArrets().subscribe(arrets => {
        this.arrets = arrets.filter(arret => !arret.poubelleVidee);
        const tournees = this.distributeArrets(this.velos, this.arrets);
        this.checkForDuplicateArrets(Object.values(tournees).flat());
        this.tourneeService.setTournees(tournees);
        this.tourneesLoaded = true;
      });
    });
  }

  distributeArrets(velos: Velo[], arrets: PointInteret[]): { [key: number]: PointInteret[][] } {
    const repartition: { [key: number]: PointInteret[][] } = {};

    velos.forEach(velo => {
      if (velo.idVelo !== undefined) {
        repartition[velo.idVelo] = [];
      }
    });

    let currentVeloIndex = 0;
    const totalVelos = velos.length;

    while (arrets.length > 0) {
      const currentVelo = velos[currentVeloIndex];
      if (currentVelo && currentVelo.idVelo !== undefined) {
        const arretBatch = arrets.splice(0, 4);
        repartition[currentVelo.idVelo].push(arretBatch);
        currentVeloIndex = (currentVeloIndex + 1) % totalVelos;
      }
    }

    return repartition;
  }

  goToVeloPage(idVelo: number): void {
    this.router.navigate([`/velo/${idVelo}`]);
  }

  checkForDuplicateArrets(data: PointInteret[][]): void {
    const allIds = data.flat().map(arret => arret.idArret);
    const duplicateIds = allIds.filter((id, index, self) => self.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
      console.warn('Doublons détectés :', duplicateIds);
    } else {
      console.log('Aucun doublon détecté !');
    }
  }
}
