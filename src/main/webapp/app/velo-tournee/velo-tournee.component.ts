import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PointInteret } from 'app/arret.service';
import { TourneeService } from 'app/tournee/tournee.service';
import { IncidentService } from 'app/incident/incident.service';
import { Incident } from 'app/incident/incident.model';
import { AccordionModule } from 'primeng/accordion';
import { routes } from '../points-interet';

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
  activeIncidents: Incident[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourneeService: TourneeService,
    private incidentService: IncidentService,
  ) {}

  ngOnInit(): void {
    this.idVelo = +this.route.snapshot.paramMap.get('id')!;
    this.tournees = this.tourneeService.getTourneesForVelo(this.idVelo);
    this.loadActiveIncidents();

    if (this.tournees.length > 0) {
      console.log(`Tournées reçues pour le vélo ${this.idVelo}:`, this.tournees);
    } else {
      console.error(`Aucune tournée trouvée pour le vélo ${this.idVelo}.`);
    }
  }

  private loadActiveIncidents(): void {
    this.incidentService.getActiveIncidents().subscribe({
      next: (incidents: Incident[]) => {
        this.activeIncidents = incidents;
        console.log('Incidents actifs chargés:', this.activeIncidents);
      },
      error: err => console.error('Erreur lors du chargement des incidents actifs:', err),
    });
  }

  private isPointBlocked(pointName: string): boolean {
    return this.activeIncidents.some(
      incident =>
        (incident.startPoint === pointName && incident.endPoint === pointName) ||
        incident.startPoint === pointName ||
        incident.endPoint === pointName,
    );
  }

  private getAllNeighbors(pointName: string): string[] {
    let neighbors: string[] = [];
    for (const route in routes) {
      if (routes[route].includes(pointName)) {
        const index = routes[route].indexOf(pointName);
        if (index > 0 && !this.isPointBlocked(routes[route][index - 1])) {
          neighbors.push(routes[route][index - 1]);
        }
        if (index < routes[route].length - 1 && !this.isPointBlocked(routes[route][index + 1])) {
          neighbors.push(routes[route][index + 1]);
        }
      }
    }
    return neighbors;
  }

  private isPathPossible(start: PointInteret, end: PointInteret): boolean {
    if (this.isPointBlocked(start.nom) || this.isPointBlocked(end.nom)) {
      return false;
    }

    const queue: string[][] = [[start.nom]];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const path = queue.shift()!;
      const lastNode = path[path.length - 1];

      if (lastNode === end.nom) {
        return true;
      }

      if (!visited.has(lastNode)) {
        visited.add(lastNode);

        const neighbors = this.getAllNeighbors(lastNode);

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push([...path, neighbor]);
          }
        }
      }
    }

    return false;
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

    // Vérifier les points bloqués et créer un nouvel itinéraire optimisé
    const optimizedTournee: PointInteret[] = [];
    let lastValidPoint: PointInteret | null = null;
    let encounterBlockage = false;

    for (let i = 0; i < validTournee.length; i++) {
      const currentPoint = validTournee[i];

      // Si c'est le premier point, l'ajouter s'il n'est pas bloqué
      if (i === 0) {
        if (!this.isPointBlocked(currentPoint.nom)) {
          optimizedTournee.push(currentPoint);
          lastValidPoint = currentPoint;
        } else {
          alert(`Le premier point "${currentPoint.nom}" est bloqué. Impossible de commencer la tournée.`);
          return;
        }
      } else if (lastValidPoint) {
        // Vérifier si on peut aller du dernier point valide au point actuel
        if (this.isPathPossible(lastValidPoint, currentPoint)) {
          optimizedTournee.push(currentPoint);
          lastValidPoint = currentPoint;
        } else {
          encounterBlockage = true;
          alert(
            `Impossible d'atteindre le point "${currentPoint.nom}" depuis "${lastValidPoint.nom}" en raison de blocages. La tournée s'arrêtera à "${lastValidPoint.nom}".`,
          );
          break;
        }
      }
    }

    if (optimizedTournee.length === 0) {
      alert('Aucun point accessible dans cette tournée en raison des blocages.');
      return;
    }

    if (encounterBlockage) {
      console.warn(`Tournée modifiée en raison de blocages. Nombre de points réduit à ${optimizedTournee.length}.`);
    }

    // Simplifier les données transmises pour éviter les problèmes de taille dans l'URL
    const tourneeSimplifiee = optimizedTournee.map(point => ({
      nom: point.nom,
      idArret: point.idArret,
      poubelleVidee: point.poubelleVidee,
      position: point.position,
    }));

    const tourneeData = JSON.stringify(tourneeSimplifiee);

    // Stocker les incidents dans le localStorage plutôt que de les passer par URL
    localStorage.setItem('active_incidents', JSON.stringify(this.activeIncidents));

    this.router.navigate(['/map-tournee', { tournee: tourneeData, index }]);
  }

  private calculateDetailedPath(start: PointInteret, end: PointInteret): string[] {
    if (this.isPointBlocked(start.nom) || this.isPointBlocked(end.nom)) {
      return [];
    }

    // Utiliser un algorithme A* simplifié pour trouver le chemin le plus court
    // en prenant en compte les points bloqués
    const queue: { path: string[]; priority: number }[] = [{ path: [start.nom], priority: 0 }];
    const visited: Set<string> = new Set();
    const distances: Map<string, number> = new Map();
    distances.set(start.nom, 0);

    // Fonction heuristique simple (distance estimée jusqu'à l'arrivée)
    const heuristic = (pointName: string): number => {
      // Si les noms sont identiques, la distance est 0
      if (pointName === end.nom) return 0;

      // Sinon, on donne une estimation approximative (1 par défaut)
      return 1;
    };

    while (queue.length > 0) {
      // Trier la file par priorité (distance parcourue + heuristique)
      queue.sort((a, b) => a.priority - b.priority);
      const { path } = queue.shift()!;
      const lastNode = path[path.length - 1];

      if (lastNode === end.nom) {
        return path;
      }

      if (!visited.has(lastNode)) {
        visited.add(lastNode);

        // Récupérer TOUS les voisins possibles, même ceux qui ne font pas partie de la tournée
        const neighbors = this.getAllNeighbors(lastNode);
        const currentDistance = distances.get(lastNode) || Infinity;

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && !this.isPointBlocked(neighbor)) {
            const newDistance = currentDistance + 1; // Coût de 1 pour chaque déplacement

            // Si on trouve un chemin plus court ou si le nœud n'a pas encore été visité
            if (newDistance < (distances.get(neighbor) || Infinity)) {
              distances.set(neighbor, newDistance);

              // Priorité = distance déjà parcourue + heuristique
              const priority = newDistance + heuristic(neighbor);

              queue.push({
                path: [...path, neighbor],
                priority: priority,
              });
            }
          }
        }
      }
    }

    console.warn(`Aucun chemin trouvé entre ${start.nom} et ${end.nom} même en passant par d'autres arrêts.`);
    return [];
  }

  private parsePosition(position: string): boolean {
    const [lat, lng] = position.replace('(', '').replace(')', '').split(' ').map(Number);
    return !isNaN(lat) && !isNaN(lng);
  }
}
