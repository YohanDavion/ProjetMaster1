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

    // Trajet de la déchetterie vers les arrêts de la tournée
    // Je vais reconstruire le tableau en m'assurant que chaque point est bien ajouté
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

    // Tracer chaque segment du trajet
    this.drawCalculatedRoute(route);
  }

  private drawCalculatedRoute(route: PointInteret[]): void {
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];

      console.log(`Tracé du segment : ${start.nom} -> ${end.nom}`);

      // Vérifier si un segment est bloqué par un incident avant de le tracer
      if (this.isSegmentBlocked([start.lat, start.lng], [end.lat, end.lng])) {
        console.warn(`Segment bloqué entre ${start.nom} et ${end.nom}.`);
        continue; // Ne pas tracer ce segment s'il est bloqué
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

  private isSegmentBlocked(startPoint: [number, number], endPoint: [number, number]): boolean {
    // Vérification des segments bloqués par les incidents
    return this.incidents.some(incident => {
      const start = this.pointsInteret.find(p => p.nom === incident.startPoint);
      const end = this.pointsInteret.find(p => p.nom === incident.endPoint);

      return (
        start &&
        end &&
        ((start.lat === startPoint[0] && start.lng === startPoint[1] && end.lat === endPoint[0] && end.lng === endPoint[1]) ||
          (start.lat === endPoint[0] && start.lng === endPoint[1] && end.lat === startPoint[0] && end.lng === startPoint[1])) &&
        incident.blocked
      );
    });
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
