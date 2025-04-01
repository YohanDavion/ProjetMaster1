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
  public estimationTemps: number = 0;
  public autonomieRestante: number = 0;
  public saison: 'ETE' | 'HIVER' = (localStorage.getItem('saison') as 'ETE' | 'HIVER') || this.getDefaultSaison();

  constructor(
    private route: ActivatedRoute,
    private arretService: ArretService,
    private incidentService: IncidentService,
  ) {}

  ngOnInit(): void {
    const tourneeData = this.route.snapshot.paramMap.get('tournee');
    this.tournee = tourneeData ? JSON.parse(tourneeData) : [];

    const index = this.route.snapshot.paramMap.get('index');
    this.tourneeIndex = index ? +index : 0;

    this.initMap();
    this.loadAllArrets();
  }

  getDefaultSaison(): 'ETE' | 'HIVER' {
    const mois = new Date().getMonth() + 1;
    return mois >= 5 && mois <= 9 ? 'ETE' : 'HIVER';
  }

  toggleSaison(): void {
    this.saison = this.saison === 'ETE' ? 'HIVER' : 'ETE';
    localStorage.setItem('saison', this.saison);
    this.highlightTourneeRoute(); // recalculer
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

    const dechetterie = this.pointsInteret.find(p => p.nom === "Porte d'Ivry");
    if (!dechetterie) {
      console.error('Déchetterie non trouvée.');
      return;
    }

    const route: PointInteret[] = [dechetterie];

    this.tournee.forEach(arret => {
      const point = this.pointsInteret.find(p => p.nom === arret.nom);
      if (point && point.lat !== undefined && point.lng !== undefined) {
        route.push(point);
      } else {
        console.warn(`Point d'intérêt invalide : ${arret.nom}`);
      }
    });

    if (route[route.length - 1].nom !== dechetterie.nom) {
      route.push(dechetterie);
    }

    if (route.length < 2) {
      console.error('Pas assez de points valides pour tracer un trajet.');
      return;
    }

    this.trajetAffiche = route.map(point => point.nom).join(' -> ');

    this.distanceTotale = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      const calculatedPath = this.calculateRoute(start, end);
      this.distanceTotale += (calculatedPath.length - 1) * 0.5;
    }

    const vitesseKmH = 5;
    const tempsParKm = 60 / vitesseKmH; // 12 min/km
    const tempsParArret = 1;

    const tempsDeplacement = this.distanceTotale * tempsParKm;
    const tempsRamassage = this.tournee.length * tempsParArret;

    this.estimationTemps = Math.round(tempsDeplacement + tempsRamassage);

    const autonomieBase = 50;
    const autonomieReelle = this.saison === 'HIVER' ? autonomieBase * 0.9 : autonomieBase;
    this.autonomieRestante = autonomieReelle - this.distanceTotale;

    this.drawCalculatedRoute(route);
  }

  private drawCalculatedRoute(route: PointInteret[]): void {
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];

      const calculatedPath = this.calculateRoute(start, end);

      if (calculatedPath.length < 2) continue;

      for (let j = 0; j < calculatedPath.length - 1; j++) {
        const segmentStart = calculatedPath[j];
        const segmentEnd = calculatedPath[j + 1];

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
      this.updateBlockedSegments();
      this.highlightTourneeRoute();
    });
  }

  private updateBlockedSegments(): void {
    this.incidents.forEach(incident => {
      const start = this.pointsInteret.find(p => p.nom === incident.startPoint);
      const end = this.pointsInteret.find(p => p.nom === incident.endPoint);

      if (start && end) {
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
      }
    });
  }
}
