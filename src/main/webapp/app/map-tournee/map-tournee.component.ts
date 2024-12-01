import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { PointInteret, ArretService } from '../arret.service';
import { Incident } from '../incident/incident.model';
import { IncidentService } from '../incident/incident.service';
import { routes } from '../points-interet';

@Component({
  selector: 'app-map-tournee',
  templateUrl: './map-tournee.component.html',
  styleUrls: ['./map-tournee.component.scss'],
})
export class MapTourneeComponent implements OnInit {
  tournee: PointInteret[] = [];
  tourneeIndex: number = 0;
  private map!: L.Map;
  private markersMap: { [key: string]: L.CircleMarker } = {};
  private allPolylines: L.Polyline[] = [];
  private highlightedRoute: L.Polyline | null = null;
  public pointsInteret: PointInteret[] = [];
  public incidents: Incident[] = [];
  public trajetAffiche: string = '';
  public distanceTotale: number = 0;

  constructor(
    private route: ActivatedRoute,
    private arretService: ArretService,
    private incidentService: IncidentService,
  ) {}

  ngOnInit(): void {
    const tourneeData = this.route.snapshot.paramMap.get('tournee');
    this.tournee = tourneeData ? JSON.parse(tourneeData) : [];
    console.log('Tournée initiale :', this.tournee);

    const index = this.route.snapshot.paramMap.get('index');
    this.tourneeIndex = index ? +index : 0;
    console.log('Index de la tournée :', this.tourneeIndex);

    this.initMap();
    this.loadAllArrets();
  }

  private initMap(): void {
    this.map = L.map('map-tournee', {
      center: [48.8566, 2.3522],
      zoom: 12,
      minZoom: 12,
      maxZoom: 19,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  private parsePosition(position: string): { lat: number; lng: number } | null {
    try {
      const [lat, lng] = position.replace('(', '').replace(')', '').split(' ').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse de la position : ${position}`, error);
    }
    return null;
  }

  private loadAllArrets(): void {
    this.arretService.getArrets().subscribe(data => {
      this.pointsInteret = data
        .map(arret => {
          if (arret.position) {
            const coords = this.parsePosition(arret.position);
            if (coords) {
              return { ...arret, ...coords };
            }
          }
          return null;
        })
        .filter((point): point is PointInteret & { lat: number; lng: number } => point !== null);

      this.addMarkers();
      this.drawAllRoutes();
      this.loadIncidents(); // Charger et appliquer les incidents
    });
  }

  private addMarkers(): void {
    this.pointsInteret.forEach(point => {
      const markerOptions: L.CircleMarkerOptions = {
        radius: point.nom === "Porte d'Ivry" ? 10 : 5,
        color: point.poubelleVidee ? 'grey' : 'red',
        fillOpacity: 0.5,
      };

      const marker = L.circleMarker([point.lat, point.lng], markerOptions).addTo(this.map);
      marker.bindPopup(`<b>${point.nom}</b><br>${point.poubelleVidee ? 'Vide' : 'À vider'}`);
      this.markersMap[point.nom] = marker;
    });
  }

  private drawAllRoutes(): void {
    Object.keys(routes).forEach(route => {
      const points = routes[route]
        .map(name => {
          const point = this.pointsInteret.find(p => p.nom === name);
          return point ? [point.lat, point.lng] : null;
        })
        .filter((p): p is [number, number] => p !== null);

      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const polyline = L.polyline([points[i], points[i + 1]], {
            color: 'grey',
            weight: 3,
          }).addTo(this.map);
          this.allPolylines.push(polyline);
        }
      }
    });
  }

  private highlightTourneeRoute(): void {
    if (this.tournee.length < 1) {
      console.warn('Aucune tournée à afficher.');
      return;
    }

    // Recherche de la déchetterie
    const dechetterie = this.pointsInteret.find(p => p.nom === "Porte d'Ivry");
    if (!dechetterie) {
      console.error('Déchetterie non trouvée.');
      return;
    }

    // Trajet de la déchetterie vers les arrêts de la tournée
    const route: PointInteret[] = [];

    // Ajouter la déchetterie au début
    route.push(dechetterie);

    // Ajouter les arrêts de la tournée
    this.tournee.forEach(arret => {
      const point = this.pointsInteret.find(p => p.nom === arret.nom);
      if (point && point.lat !== undefined && point.lng !== undefined) {
        route.push(point);
      } else {
        console.warn(`Point d'intérêt invalide : ${arret.nom}`);
      }
    });

    // Ajouter la déchetterie à la fin si elle n'est pas déjà présente
    if (route[route.length - 1].nom !== dechetterie.nom) {
      route.push(dechetterie);
    }

    // Vérifier les points valides
    if (route.length < 2) {
      console.error('Pas assez de points valides pour tracer un trajet.');
      return;
    }

    // Afficher le trajet en console pour vérification
    console.log('Route complète :', route);

    // Affichage du trajet sous forme de texte sans duplication
    this.trajetAffiche = route.map(point => point.nom).join(' -> ');
    console.log('Trajet affiché :', this.trajetAffiche);

    // Calculer la distance totale en prenant chaque segment de 500m
    this.distanceTotale = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];

      // Utiliser calculateRoute pour obtenir tous les points entre start et end
      const calculatedPath = this.calculateRoute(start, end);
      this.distanceTotale += (calculatedPath.length - 1) * 0.5; // Chaque segment entre deux points d'intérêt est de 500m
    }
    console.log('Distance totale :', this.distanceTotale.toFixed(2), 'km');

    // Tracer chaque segment du trajet
    this.drawCalculatedRoute(route);
  }

  private drawCalculatedRoute(route: PointInteret[]): void {
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];

      console.log(`Calcul du segment : ${start.nom} -> ${end.nom}`);

      // Utiliser calculateRoute pour trouver le chemin entre start et end
      const calculatedPath = this.calculateRoute(start, end);

      if (calculatedPath.length < 2) {
        console.warn(`Aucun chemin trouvé entre ${start.nom} et ${end.nom}, le segment ne sera pas tracé.`);
        continue; // Sauter ce segment si aucun chemin n'est trouvé
      }

      // Tracer chaque segment du chemin calculé
      for (let j = 0; j < calculatedPath.length - 1; j++) {
        const segmentStart = calculatedPath[j];
        const segmentEnd = calculatedPath[j + 1];

        console.log(`Tracé du sous-segment : (${segmentStart.lat}, ${segmentStart.lng}) -> (${segmentEnd.lat}, ${segmentEnd.lng})`);

        L.polyline(
          [
            [segmentStart.lat, segmentStart.lng],
            [segmentEnd.lat, segmentEnd.lng],
          ],
          {
            color: 'blue',
            weight: 4,
          },
        ).addTo(this.map);
      }
    }
  }

  private calculateRoute(start: PointInteret, end: PointInteret): { lat: number; lng: number }[] {
    const blockedSegments = this.incidents
      .filter(incident => incident.blocked)
      .map(incident => `${incident.startPoint}->${incident.endPoint}`);

    const queue: string[][] = [[start.nom]];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const path = queue.shift()!;
      const lastNode = path[path.length - 1];

      if (lastNode === end.nom) {
        return this.getLatLngPath(path);
      }

      if (!visited.has(lastNode)) {
        visited.add(lastNode);

        const neighbors = this.getAllNeighbors(lastNode).filter(neighbor => {
          return !blockedSegments.includes(`${lastNode}->${neighbor}`);
        });

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push([...path, neighbor]);
          }
        }
      }
    }

    console.error('Aucun chemin trouvé.');
    return [];
  }

  private getLatLngPath(path: string[]): { lat: number; lng: number }[] {
    return path
      .map(name => {
        const point = this.pointsInteret.find(p => p.nom === name);
        return point ? { lat: point.lat, lng: point.lng } : null;
      })
      .filter((p): p is { lat: number; lng: number } => p !== null);
  }

  private getAllNeighbors(pointName: string): string[] {
    let neighbors: string[] = [];
    for (const route in routes) {
      if (routes[route].includes(pointName)) {
        const index = routes[route].indexOf(pointName);
        if (index > 0) {
          neighbors.push(routes[route][index - 1]);
        }
        if (index < routes[route].length - 1) {
          neighbors.push(routes[route][index + 1]);
        }
      }
    }
    return neighbors;
  }

  private loadIncidents(): void {
    this.incidentService.getActiveIncidents().subscribe(data => {
      this.incidents = data;
      console.log('Incidents actifs :', this.incidents);
      this.updateBlockedSegments();
      this.highlightTourneeRoute(); // Mettre à jour la route après le chargement des incidents
    });
  }

  private updateBlockedSegments(): void {
    this.incidents.forEach(incident => {
      const start = this.pointsInteret.find(p => p.nom === incident.startPoint);
      const end = this.pointsInteret.find(p => p.nom === incident.endPoint);

      if (start && end) {
        console.log(`Incident entre ${start.nom} et ${end.nom}`);
        L.polyline(
          [
            [start.lat, start.lng],
            [end.lat, end.lng],
          ],
          {
            color: 'red',
            weight: 4,
          },
        ).addTo(this.map);
      } else {
        console.warn(`Incident invalide entre ${incident.startPoint} et ${incident.endPoint}`);
      }
    });
  }
}
