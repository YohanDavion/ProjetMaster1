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

  constructor(
    private veloService: VeloService,
    private arretService: ArretService,
    private incidentService: IncidentService,
    private router: Router,
    public tourneeService: TourneeService,
    private accountService: AccountService,
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID du vélo à partir du service d'authentification
    this.accountService.identity().subscribe(account => {
      if (account && account.veloId) {
        this.idVelo = account.veloId;
        console.log('ID du Vélo récupéré :', this.idVelo); // Ajoutez ce log pour vérifier la valeur
        this.loadData();
      } else {
        console.log('Aucun ID de vélo associé à cet utilisateur.');
        // Chargez les données générales si aucun ID de vélo n'est associé
        this.loadData();
      }
    });
  }

  loadData(): void {
    if (this.tourneesLoaded) {
      console.warn('Les tournées ont déjà été chargées.');
      return;
    }

    this.incidentService.getActiveIncidents().subscribe(incidents => {
      this.incidents = incidents;

      this.veloService.getVelosWithPosition().subscribe(velos => {
        // Charger tous les vélos
        this.velos = velos;

        this.arretService.getArrets().subscribe(arrets => {
          this.arrets = arrets.filter(arret => !arret.poubelleVidee);
          // Distribuer les arrêts à tous les vélos
          const tournees = this.distributeArretsOptimized(this.velos, this.arrets);
          this.checkForDuplicateArrets(Object.values(tournees).flat());
          // Enregistrer toutes les tournées dans TourneeService
          this.tourneeService.setTournees(tournees);
          this.tourneesLoaded = true;
        });
      });
    });
  }

  distributeArretsOptimized(velos: Velo[], arrets: PointInteret[]): { [key: number]: PointInteret[][] } {
    const repartition: { [key: number]: PointInteret[][] } = {};
    const assignedArrets = new Set<PointInteret>();

    // Initialiser les tournées pour chaque vélo
    velos.forEach(velo => {
      if (velo.idVelo !== undefined) {
        repartition[velo.idVelo] = [];
      }
    });

    // Distribuer les arrêts en utilisant les routes disponibles pour optimiser le trajet
    let currentVeloIndex = 0;
    const totalVelos = velos.length;

    while (assignedArrets.size < arrets.length) {
      const currentVelo = velos[currentVeloIndex];
      if (currentVelo && currentVelo.idVelo !== undefined) {
        let currentTournee: PointInteret[] = [];

        while (currentTournee.length < 4 && assignedArrets.size < arrets.length) {
          let nextArret: PointInteret | undefined;

          if (currentTournee.length === 0) {
            // Sélectionner un arrêt non assigné au hasard pour commencer
            nextArret = arrets.find(arret => !assignedArrets.has(arret));
          } else {
            // Trouver le prochain arrêt connecté par une route et non bloqué par un incident
            const lastArret = currentTournee[currentTournee.length - 1];
            nextArret = this.findNextConnectedArret(lastArret, arrets, assignedArrets);
          }

          if (nextArret) {
            currentTournee.push(nextArret);
            assignedArrets.add(nextArret);
          } else {
            break; // Si aucun arrêt connecté n'est trouvé, arrêter la tournée
          }
        }

        if (currentTournee.length > 0) {
          repartition[currentVelo.idVelo].push(currentTournee);
        }
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
    return this.incidents.some(incident => {
      return (
        (incident.startPoint === startArret.nom && incident.endPoint === endArret.nom) ||
        (incident.startPoint === endArret.nom && incident.endPoint === startArret.nom)
      );
    });
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
