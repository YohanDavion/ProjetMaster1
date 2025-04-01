import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VeloService } from 'app/velo/velo.service';
import { ArretService, PointInteret } from 'app/arret.service';
import { Velo } from 'app/velo/velo.model';
import { CommonModule } from '@angular/common';
import { TourneeService } from 'app/tournee/tournee.service';
import { routes } from '../points-interet';
import { IncidentService } from '../incident/incident.service';
import { Incident } from '../incident/incident.model';
import { AccountService } from 'app/core/auth/account.service';

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
  incidents: Incident[] = [];
  tourneesLoaded: boolean = false;
  idVelo: number | null = null;
  saison: 'ETE' | 'HIVER' = (localStorage.getItem('saison') as 'ETE' | 'HIVER') || this.getSaison();
  estimationTempsParVelo: { [key: number]: number[] } = {};

  constructor(
    private veloService: VeloService,
    private arretService: ArretService,
    private incidentService: IncidentService,
    private router: Router,
    public tourneeService: TourneeService,
    private accountService: AccountService,
  ) {}

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => {
      if (account && account.veloId) {
        this.idVelo = account.veloId;
        this.loadData();
      } else {
        this.loadData();
      }
    });
  }

  toggleSaison(): void {
    this.saison = this.saison === 'ETE' ? 'HIVER' : 'ETE';
    localStorage.setItem('saison', this.saison);
    this.tourneesLoaded = false;
    this.loadData();
  }

  loadData(): void {
    if (this.tourneesLoaded) return;

    this.incidentService.getActiveIncidents().subscribe(incidents => {
      this.incidents = incidents;

      this.veloService.getVelosWithPosition().subscribe(velos => {
        this.velos = velos;

        this.arretService.getArrets().subscribe(arrets => {
          this.arrets = arrets.filter(arret => !arret.poubelleVidee);
          const tournees = this.distributeArretsOptimized(this.velos, this.arrets);
          this.checkForDuplicateArrets(Object.values(tournees).flat());
          this.tourneeService.setTournees(tournees);
          this.tourneesLoaded = true;
        });
      });
    });
  }

  distributeArretsOptimized(velos: Velo[], arrets: PointInteret[]): { [key: number]: PointInteret[][] } {
    const repartition: { [key: number]: PointInteret[][] } = {};
    const assignedArrets = new Set<PointInteret>();
    const autonomieMaxKm = this.getAutonomieParSaison();
    const distanceParArret = 0.5;
    const vitesseKmH = 5;
    const tempsParKm = 60 / vitesseKmH;
    const tempsRamassageParArret = 1;

    let distanceParcourue = 0;

    velos.forEach(velo => {
      if (velo.idVelo !== undefined) {
        repartition[velo.idVelo] = [];
        this.estimationTempsParVelo[velo.idVelo] = [];
      }
    });

    let currentVeloIndex = 0;
    const totalVelos = velos.length;

    while (assignedArrets.size < arrets.length) {
      const currentVelo = velos[currentVeloIndex];
      if (currentVelo && currentVelo.idVelo !== undefined) {
        let currentTournee: PointInteret[] = [];

        while (currentTournee.length < 4 && assignedArrets.size < arrets.length) {
          let nextArret: PointInteret | undefined;

          if (currentTournee.length === 0) {
            nextArret = arrets.find(arret => !assignedArrets.has(arret));
          } else {
            const lastArret = currentTournee[currentTournee.length - 1];
            nextArret = this.findNextConnectedArret(lastArret, arrets, assignedArrets);
          }

          if (nextArret) {
            currentTournee.push(nextArret);
            assignedArrets.add(nextArret);
            distanceParcourue += distanceParArret;

            if (distanceParcourue >= autonomieMaxKm) {
              break;
            }
          } else {
            break;
          }
        }

        if (currentTournee.length > 0) {
          repartition[currentVelo.idVelo].push(currentTournee);

          const distanceTotaleKm = currentTournee.length * distanceParArret;
          const tempsDeplacement = distanceTotaleKm * tempsParKm;
          const tempsTotal = currentTournee.length * tempsRamassageParArret + tempsDeplacement;

          this.estimationTempsParVelo[currentVelo.idVelo].push(Math.round(tempsTotal));
        }

        distanceParcourue = 0;
      }

      currentVeloIndex = (currentVeloIndex + 1) % totalVelos;
    }

    return repartition;
  }

  findNextConnectedArret(currentArret: PointInteret, arrets: PointInteret[], assignedArrets: Set<PointInteret>): PointInteret | undefined {
    for (const route of Object.values(routes)) {
      if (route.includes(currentArret.nom)) {
        for (const arretNom of route) {
          const nextArret = arrets.find(arret => arret.nom === arretNom && !assignedArrets.has(arret));
          if (nextArret && !this.isSegmentBlocked(currentArret, nextArret)) {
            return nextArret;
          }
        }
      }
    }
    return undefined;
  }

  isSegmentBlocked(startArret: PointInteret, endArret: PointInteret): boolean {
    return this.incidents.some(
      incident =>
        (incident.startPoint === startArret.nom && incident.endPoint === endArret.nom) ||
        (incident.startPoint === endArret.nom && incident.endPoint === startArret.nom),
    );
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

  getSaison(): 'ETE' | 'HIVER' {
    const mois = new Date().getMonth() + 1;
    return mois >= 5 && mois <= 9 ? 'ETE' : 'HIVER';
  }

  getAutonomieParSaison(): number {
    const autonomieBase = 50;
    return this.saison === 'HIVER' ? autonomieBase * 0.9 : autonomieBase;
  }
}
