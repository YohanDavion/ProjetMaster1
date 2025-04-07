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

    if (tourneeData) {
      try {
        const parsedData = JSON.parse(tourneeData);
        this.tournee = parsedData;
      } catch (e) {
        console.error("Erreur lors de l'analyse des données de tournée:", e);
        this.tournee = [];
      }
    }

    // Récupérer les incidents depuis localStorage
    const incidentsData = localStorage.getItem('active_incidents');
    if (incidentsData) {
      try {
        this.incidents = JSON.parse(incidentsData);
        console.log('Incidents récupérés depuis localStorage:', this.incidents);
      } catch (e) {
        console.error("Erreur lors de l'analyse des incidents:", e);
      }
    }

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

      // Si des incidents ont été récupérés, ne pas les recharger
      if (this.incidents.length === 0) {
        this.loadIncidents(); // Charger et appliquer les incidents
      } else {
        this.updateBlockedSegments(); // Appliquer directement les incidents récupérés
        this.highlightTourneeRoute(); // Afficher la tournée
      }
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
    // Supprimer l'ancien itinéraire s'il existe
    if (this.highlightedRoute) {
      this.map.removeLayer(this.highlightedRoute);
      this.highlightedRoute = null;
    }
    this.allPolylines.forEach(p => {
      if (this.map.hasLayer(p)) {
        this.map.removeLayer(p);
      }
    }); // Supprimer aussi les routes grises pour la clarté
    this.allPolylines = [];

    if (this.tournee.length < 1) {
      console.warn('Aucune tournée à afficher.');
      return;
    }

    const dechetterie = this.pointsInteret.find(p => p.nom === "Porte d'Ivry");
    if (!dechetterie) {
      console.error('Déchetterie non trouvée.');
      return;
    }

    const routePoints: PointInteret[] = [dechetterie];

    this.tournee.forEach(arret => {
      const point = this.pointsInteret.find(p => p.nom === arret.nom);
      if (point && point.lat !== undefined && point.lng !== undefined) {
        routePoints.push(point);
      } else {
        console.warn(`Point d'intérêt invalide ou introuvable pour l'affichage: ${arret.nom}`);
      }
    });

    if (routePoints[routePoints.length - 1].nom !== dechetterie.nom) {
      routePoints.push(dechetterie);
    }

    if (routePoints.length < 2) {
      console.error('Pas assez de points valides pour tracer un trajet.');
      return;
    }

    this.trajetAffiche = routePoints.map(point => point.nom).join(' -> ');

    let fullPathLatLngs: L.LatLng[] = [];
    this.distanceTotale = 0;

    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i + 1];
      const calculatedPath = this.calculateRoute(start, end);

      if (calculatedPath.length > 1) {
        const segmentLatLngs = calculatedPath.map(p => L.latLng(p.lat, p.lng));
        fullPathLatLngs = fullPathLatLngs.concat(segmentLatLngs.slice(1)); // Ajouter en évitant les doublons

        // Calculer la distance du segment
        let segmentDistance = 0;
        for (let j = 0; j < calculatedPath.length - 1; j++) {
          segmentDistance += this.getDistance(
            calculatedPath[j].lat,
            calculatedPath[j].lng,
            calculatedPath[j + 1].lat,
            calculatedPath[j + 1].lng,
          );
        }
        this.distanceTotale += segmentDistance;
      } else {
        console.warn(`Impossible de calculer un chemin entre ${start.nom} et ${end.nom} en raison de blocages. Ce segment est ignoré.`);
        alert(`Attention: Impossible de trouver un chemin entre ${start.nom} et ${end.nom}. L'itinéraire affiché peut être incomplet.`);
        // On ne peut pas continuer la route si un segment est impossible
        break;
      }
    }

    // S'assurer que le premier point est bien ajouté si la boucle a fonctionné
    if (fullPathLatLngs.length > 0 || routePoints.length >= 1) {
      const firstPoint = this.pointsInteret.find(p => p.nom === routePoints[0].nom);
      if (firstPoint) {
        fullPathLatLngs.unshift(L.latLng(firstPoint.lat, firstPoint.lng));
      }
    }

    if (fullPathLatLngs.length > 1) {
      this.highlightedRoute = L.polyline(fullPathLatLngs, { color: 'blue', weight: 5 }).addTo(this.map);
      this.map.fitBounds(this.highlightedRoute.getBounds());
    } else {
      console.error("Impossible d'afficher un itinéraire valide.");
      // On pourrait centrer sur la déchetterie ou le premier point si besoin
      if (dechetterie) this.map.setView([dechetterie.lat, dechetterie.lng], 14);
    }

    const vitesseKmH = 5;
    const tempsParKm = 60 / vitesseKmH; // 12 min/km
    const tempsParArret = 1;

    const tempsDeplacement = this.distanceTotale * tempsParKm;
    // Le nombre d'arrêts à vider est la longueur de `this.tournee`
    const tempsRamassage = this.tournee.length * tempsParArret;

    this.estimationTemps = Math.round(tempsDeplacement + tempsRamassage);

    const autonomieBase = 50;
    const autonomieReelle = this.saison === 'HIVER' ? autonomieBase * 0.9 : autonomieBase;
    this.autonomieRestante = autonomieReelle - this.distanceTotale;

    // drawCalculatedRoute n'est plus nécessaire, l'affichage se fait ici
  }

  private calculateRoute(start: PointInteret, end: PointInteret): { lat: number; lng: number }[] {
    // Vérifier si les points eux-mêmes sont bloqués
    if (this.isPointBlocked(start.nom) || this.isPointBlocked(end.nom)) {
      console.warn(`Un des points ${start.nom} ou ${end.nom} est bloqué.`);
      return [];
    }

    // Utiliser un algorithme A* pour trouver le chemin le plus court
    const queue: { path: string[]; priority: number; cost: number }[] = [{ path: [start.nom], priority: 0, cost: 0 }];
    const visited: Set<string> = new Set();
    const distances: Map<string, number> = new Map();
    distances.set(start.nom, 0);

    // Heuristique: distance à vol d'oiseau
    const heuristic = (pointName: string): number => {
      const pointA = this.pointsInteret.find(p => p.nom === pointName);
      const pointB = this.pointsInteret.find(p => p.nom === end.nom);
      if (pointA && pointB) {
        return this.getDistance(pointA.lat, pointA.lng, pointB.lat, pointB.lng);
      }
      return 0; // Retourne 0 si un point est introuvable
    };

    while (queue.length > 0) {
      queue.sort((a, b) => a.priority - b.priority);
      const { path, cost } = queue.shift()!;
      const lastNodeName = path[path.length - 1];

      if (lastNodeName === end.nom) {
        return this.getLatLngPath(path); // Chemin trouvé
      }

      if (!visited.has(lastNodeName)) {
        visited.add(lastNodeName);

        const neighbors = this.getAllNeighbors(lastNodeName);
        const lastNodePoint = this.pointsInteret.find(p => p.nom === lastNodeName);

        if (!lastNodePoint) continue; // Ne devrait pas arriver si les données sont cohérentes

        for (const neighborName of neighbors) {
          if (!visited.has(neighborName) && !this.isPointBlocked(neighborName)) {
            const neighborPoint = this.pointsInteret.find(p => p.nom === neighborName);
            if (!neighborPoint) continue;

            // Coût réel basé sur la distance
            const segmentDistance = this.getDistance(lastNodePoint.lat, lastNodePoint.lng, neighborPoint.lat, neighborPoint.lng);
            const newCost = cost + segmentDistance;

            if (newCost < (distances.get(neighborName) || Infinity)) {
              distances.set(neighborName, newCost);
              const priority = newCost + heuristic(neighborName);
              queue.push({
                path: [...path, neighborName],
                priority: priority,
                cost: newCost,
              });
            }
          }
        }
      }
    }

    console.warn(`Aucun chemin trouvé entre ${start.nom} et ${end.nom} même en passant par d'autres arrêts.`);
    return []; // Aucun chemin trouvé
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

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance en km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private isPointBlocked(pointName: string): boolean {
    return this.incidents.some(
      incident =>
        (incident.startPoint === pointName && incident.endPoint === pointName) ||
        incident.startPoint === pointName ||
        incident.endPoint === pointName,
    );
  }

  private loadIncidents(): void {
    this.incidentService.getActiveIncidents().subscribe((incidents: Incident[]) => {
      this.incidents = incidents;
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
