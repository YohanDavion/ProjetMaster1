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
      this.highlightTourneeRoute();
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

    // Trajet de la déchetterie vers le premier arrêt, puis chaque arrêt suivant
    let route = [dechetterie, ...this.tournee];

    // Ajout de la déchetterie à la fin si elle n'est pas déjà là
    if (route[route.length - 1].nom !== dechetterie.nom) {
      route.push(dechetterie);
    }

    // Validation des points avec coordonnées valides
    const validRoute = route.filter(point => point && point.lat !== undefined && point.lng !== undefined);
    if (validRoute.length < 2) {
      console.error('Pas assez de points valides pour tracer un trajet.');
      return;
    }

    console.log('Trajet brut :', route);
    console.log('Trajet valide :', validRoute);

    // Affichage du trajet en texte sans duplication
    this.trajetAffiche = validRoute.map(point => point.nom).join(' -> ');
    console.log('Trajet affiché :', this.trajetAffiche);

    // Tracer chaque segment du trajet, de la déchetterie à chaque arrêt successivement
    this.drawCalculatedRoute(validRoute);
  }

  private drawCalculatedRoute(validRoute: PointInteret[]): void {
    for (let i = 0; i < validRoute.length - 1; i++) {
      const start = validRoute[i];
      const end = validRoute[i + 1];

      console.log(`Tracé du segment : ${start.nom} -> ${end.nom}`);

      // Vérifier si une route existe entre les arrêts
      const routeSegment = routes[start.nom]?.includes(end.nom) || routes[end.nom]?.includes(start.nom);
      if (!routeSegment) {
        console.warn(`Aucune route directe entre ${start.nom} et ${end.nom}.`);
        continue;
      }

      // Tracer le segment de route entre deux arrêts
      L.polyline(
        [
          [start.lat, start.lng],
          [end.lat, end.lng],
        ],
        {
          color: 'blue',
          weight: 4,
        },
      ).addTo(this.map);
    }
  }

  private loadIncidents(): void {
    this.incidentService.getActiveIncidents().subscribe(data => {
      this.incidents = data;
      console.log('Incidents actifs :', this.incidents);
      this.updateBlockedSegments();
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
