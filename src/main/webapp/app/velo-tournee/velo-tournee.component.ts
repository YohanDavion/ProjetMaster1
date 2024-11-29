import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PointInteret } from 'app/arret.service';
import { TourneeService } from 'app/tournee/tournee.service';
import { AccordionModule } from 'primeng/accordion';

@Component({
  standalone: true,
  selector: 'app-velo-tournee',
  templateUrl: './velo-tournee.component.html',
  imports: [CommonModule, AccordionModule],
  styleUrls: ['./velo-tournee.component.scss'],
})
export class VeloTourneeComponent implements OnInit {
  idVelo!: number;
  tournees: PointInteret[][] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourneeService: TourneeService,
  ) {}

  ngOnInit(): void {
    this.idVelo = +this.route.snapshot.paramMap.get('id')!;
    this.tournees = this.tourneeService.getTourneesForVelo(this.idVelo);

    if (this.tournees.length > 0) {
      console.log(`Tournées reçues pour le vélo ${this.idVelo}:`, this.tournees);
    } else {
      console.error(`Aucune tournée trouvée pour le vélo ${this.idVelo}.`);
    }
  }

  markAsVided(arret: PointInteret): void {
    if (!arret.poubelleVidee) {
      arret.poubelleVidee = true;
      console.log(`Arrêt "${arret.nom}" marqué comme vidé.`);
    } else {
      console.warn(`Arrêt "${arret.nom}" est déjà marqué comme vidé.`);
    }
  }

  navigateToMapTournee(tournee: PointInteret[], index: number): void {
    const validTournee = tournee.filter(arret => arret.position && this.parsePosition(arret.position));
    if (validTournee.length === 0) {
      console.error('La tournée ne contient aucun arrêt valide avec des coordonnées.');
      return;
    }

    const tourneeData = JSON.stringify(validTournee);
    this.router.navigate(['/map-tournee', { tournee: tourneeData, index }]);
  }

  private parsePosition(position: string): boolean {
    const [lat, lng] = position.replace('(', '').replace(')', '').split(' ').map(Number);
    return !isNaN(lat) && !isNaN(lng);
  }
}
