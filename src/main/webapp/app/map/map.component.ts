import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { routes } from '../points-interet';
import { ArretService, PointInteret } from '../arret.service';
import { Velo } from 'app/velo/velo.model';
import { VeloService } from '../velo/velo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Incident } from 'app/incident/incident.model';
import { IncidentService } from 'app/incident/incident.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  public startPoint: PointInteret | null = null;
  public endPoint: PointInteret | null = null;
  private map!: L.Map;
  private markersMap: { [key: string]: L.Marker | L.CircleMarker } = {};
  private selectedMarker: L.CircleMarker | null = null;
  private selectedPolyline: L.Polyline | null = null;
  private allPolylines: L.Polyline[] = [];
  public pointsInteret: (PointInteret & { lat: number; lng: number })[] = [];
  public velos: Velo[] = [];
  public incidents: Incident[] = [];
  public newIncident: Incident = { startPoint: '', endPoint: '', blocked: true };

  constructor(
    private arretService: ArretService,
    private veloService: VeloService,
    private incidentService: IncidentService,
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPointsInteret();
    this.addVeloMarkers();
    this.loadIncidents();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [48.8566, 2.3522],
      zoom: 12,
      minZoom: 12,
      maxZoom: 19,
      maxBounds: [
        [48.5, 2.0],
        [49.0, 2.7],
      ],
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.7,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  private parsePosition(position: string): { lat: number; lng: number } {
    const [lat, lng] = position.replace('(', '').replace(')', '').split(' ').map(Number);
    return { lat, lng };
  }

  private loadPointsInteret(): void {
    this.arretService.getArrets().subscribe(data => {
      this.pointsInteret = data
        .map(arret => {
          if (arret.position) {
            const { lat, lng } = this.parsePosition(arret.position);
            return { ...arret, lat, lng };
          }
          return null;
        })
        .filter((point): point is PointInteret & { lat: number; lng: number } => point !== null);

      this.addMarkers();
      this.drawRoads();
    });
  }

  private addMarkers(): void {
    this.pointsInteret.forEach(point => {
      const markerOptions: L.CircleMarkerOptions = {
        radius: point.nom === "Porte d'Ivry" ? 10 : 5,
        color: point.nom === "Porte d'Ivry" ? 'green' : point.poubelleVidee ? 'grey' : 'red',
        fillOpacity: point.nom === "Porte d'Ivry" ? 0.8 : 0.5,
      };

      const marker = L.circleMarker([point.lat, point.lng], markerOptions).addTo(this.map);

      marker.bindPopup(`<b>${point.nom}</b><br>Poubelle : ${point.poubelleVidee ? 'Vide' : 'Pleine'}`);
      this.markersMap[point.nom] = marker;
    });
  }

  private drawRoads(): void {
    Object.keys(routes).forEach(road => {
      const points = routes[road]
        .map(name => {
          const point = this.pointsInteret.find(p => p.nom === name);
          return point ? [point.lat, point.lng] : null;
        })
        .filter((p): p is [number, number] => p !== null);

      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const polyline = L.polyline([points[i], points[i + 1]], {
            color: 'grey',
            weight: 4,
          }).addTo(this.map);
          this.allPolylines.push(polyline);
        }
      }
    });

    this.updateBlockedSegments();
  }

  loadIncidents(): void {
    this.incidentService.getActiveIncidents().subscribe((data: Incident[]) => {
      console.log('Incidents récupérés :', data);
      this.incidents = data;
      this.updateBlockedSegments(); // Met à jour les segments bloqués
    });
  }

  submitIncident(): void {
    if (!this.newIncident.startPoint || !this.newIncident.endPoint) {
      alert('Veuillez sélectionner un départ et une arrivée.');
      return;
    }

    if (this.newIncident.startPoint === this.newIncident.endPoint) {
      alert("Le départ et l'arrivée ne peuvent pas être les mêmes.");
      return;
    }

    this.incidentService.addIncident(this.newIncident).subscribe(() => {
      alert('Incident signalé.');
      this.loadIncidents(); // Recharger la liste après l'ajout
      this.newIncident = { startPoint: '', endPoint: '', blocked: true }; // Réinitialiser le formulaire
    });
  }

  public startMovingVelo(idVelo: number | undefined, destination: PointInteret): void {
    if (!idVelo) {
      console.error('ID du vélo manquant.');
      return;
    }

    const velo = this.velos.find(v => v.idVelo === idVelo);
    if (velo) {
      const startPoint = this.pointsInteret.find(p => p.lat === velo.position?.lat && p.lng === velo.position?.lng);

      if (!startPoint) {
        console.error('Point de départ introuvable.');
        return;
      }

      // Vérifier si le point de départ ou d'arrivée est bloqué
      if (this.isPointBlocked(startPoint.nom) || this.isPointBlocked(destination.nom)) {
        alert("Le point de départ ou d'arrivée est actuellement bloqué par un incident.");
        return;
      }

      const route = this.calculateRoute(startPoint, destination);

      if (route.length === 0) {
        alert('Aucun chemin disponible. Tous les chemins possibles sont bloqués par des incidents.');
        return;
      }

      this.moveVelo(velo, route);
    } else {
      console.error(`Vélo avec ID ${idVelo} introuvable.`);
    }
  }

  private isPointBlocked(pointName: string): boolean {
    return this.incidents.some(
      incident =>
        (incident.startPoint === pointName && incident.endPoint === pointName) ||
        incident.startPoint === pointName ||
        incident.endPoint === pointName,
    );
  }

  private calculateRoute(start: PointInteret, end: PointInteret): { lat: number; lng: number }[] {
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

        const neighbors = this.getAllNeighbors(lastNode).filter(neighbor => !this.isPointBlocked(neighbor));

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push([...path, neighbor]);
          }
        }
      }
    }

    return [];
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

  private getLatLngPath(path: string[]): { lat: number; lng: number }[] {
    return path
      .map(name => {
        const point = this.pointsInteret.find(p => p.nom === name);
        return point ? { lat: point.lat, lng: point.lng } : null;
      })
      .filter((p): p is { lat: number; lng: number } => p !== null);
  }

  private moveVelo(velo: Velo, path: { lat: number; lng: number }[]): void {
    if (path.length === 0) {
      console.error('Aucun chemin fourni pour le vélo.');
      return;
    }

    console.log(`Déplacement du vélo ${velo.idVelo} sur ${path.length} points.`);

    let index = 0;
    const interval = setInterval(() => {
      if (index < path.length) {
        const position = path[index];
        console.log(`Vélo ${velo.idVelo} se déplace à ${position.lat}, ${position.lng}`);

        // Mettre à jour la position et réduire l'autonomie
        velo.position = position;
        this.updateVeloMarker(velo.idVelo!, position);

        // Vérifier si le prochain point est bloqué
        if (index < path.length - 1) {
          const nextPoint = this.pointsInteret.find(p => p.lat === path[index + 1].lat && p.lng === path[index + 1].lng);
          if (nextPoint && this.isPointBlocked(nextPoint.nom)) {
            console.warn(`Vélo ${velo.idVelo} bloqué par un incident sur le point ${nextPoint.nom}`);
            alert('Point bloqué détecté. Déplacement interrompu.');
            clearInterval(interval);
            return;
          }
        }

        // Réduire l'autonomie tous les 20 arrêts
        if (index % 20 === 0) {
          this.reduireAutonomie(velo, 1);
        }

        // Gestion de la charge et des arrêts
        const arret = this.pointsInteret.find(p => p.lat === position.lat && p.lng === position.lng);
        if (arret && !arret.poubelleVidee) {
          this.viderPoubelle(velo, arret);
        }

        // Vérifier l'autonomie ou la capacité restante
        if (velo.autonomie <= 2 || velo.capaciteRestante <= 0) {
          console.log(`Vélo ${velo.idVelo} retourne à la déchèterie.`);
          clearInterval(interval);
          this.retourDecheterie(velo);
          return;
        }

        index++;
      } else {
        clearInterval(interval);
        console.log(`Vélo ${velo.idVelo} est arrivé à destination.`);
      }
    }, 1000);
  }

  private reduireAutonomie(velo: Velo, perte: number): void {
    velo.autonomie -= perte;
    console.log(`Autonomie du vélo ${velo.idVelo}: ${velo.autonomie} km.`);
  }

  private viderPoubelle(velo: Velo, arret: PointInteret): void {
    const chargeAjoutee = 50; // 50 kg par poubelle vidée
    if (velo.capaciteRestante >= chargeAjoutee) {
      velo.capaciteRestante -= chargeAjoutee;
      arret.poubelleVidee = true; // Mettre à jour l'état de l'arrêt
      console.log(`Vélo ${velo.idVelo} a vidé la poubelle à l'arrêt ${arret.nom}. Charge restante : ${velo.capaciteRestante} kg.`);
    } else {
      console.warn(`Vélo ${velo.idVelo} : capacité maximale atteinte. Retour à la déchèterie nécessaire.`);
    }
  }

  private retourDecheterie(velo: Velo): void {
    const decheterie = this.pointsInteret.find(p => p.nom === "Porte d'Ivry");
    if (decheterie) {
      const positionAsPointInteret: PointInteret = {
        idArret: 0,
        nom: 'Position actuelle',
        poubelleVidee: false,
        lat: velo.position!.lat,
        lng: velo.position!.lng,
      };

      const routeRetour = this.calculateRoute(positionAsPointInteret, decheterie);
      this.moveVelo(velo, routeRetour);

      // Réinitialisation après retour
      velo.autonomie = 50; // Réinitialiser l'autonomie
      velo.capaciteRestante = 200; // Vider le vélo
      console.log(`Vélo ${velo.idVelo} a été rechargé et vidé à la déchèterie.`);
    } else {
      console.error('Déchèterie introuvable.');
    }
  }

  public deselectRoute(): void {
    if (this.selectedPolyline) {
      this.selectedPolyline.setStyle({ color: 'grey' });
      this.selectedPolyline = null;
    }
    this.allPolylines.forEach(line => this.map.addLayer(line));
  }

  private updateBlockedSegments(): void {
    console.log('Mise à jour des segments bloqués...');

    this.incidents.forEach(incident => {
      const start = this.pointsInteret.find(p => p.nom === incident.startPoint);
      const end = this.pointsInteret.find(p => p.nom === incident.endPoint);

      if (start && end) {
        const blockedSegment = this.allPolylines.find(polyline => {
          const latLngs = polyline.getLatLngs() as L.LatLng[];
          return (
            (latLngs[0].lat === start.lat && latLngs[0].lng === start.lng && latLngs[1].lat === end.lat && latLngs[1].lng === end.lng) ||
            (latLngs[0].lat === end.lat && latLngs[0].lng === end.lng && latLngs[1].lat === start.lat && latLngs[1].lng === start.lng)
          );
        });

        // Modifier la couleur si le segment est trouvé
        if (blockedSegment) {
          blockedSegment.setStyle({ color: 'red' });
          console.log(`Segment bloqué mis à jour : ${incident.startPoint} -> ${incident.endPoint}`);
        } else {
          console.warn(`Segment bloqué introuvable : ${incident.startPoint} -> ${incident.endPoint}`);
        }
      }
    });
  }

  private isSegmentBlocked(startPoint: [number, number], endPoint: [number, number]): boolean {
    console.log('Vérification des segments bloqués :', { startPoint, endPoint, incidents: this.incidents });

    return this.incidents.some(incident => {
      const start = this.pointsInteret.find(p => p.nom === incident.startPoint);
      const end = this.pointsInteret.find(p => p.nom === incident.endPoint);

      const match =
        ((start?.lat === startPoint[0] && start?.lng === startPoint[1] && end?.lat === endPoint[0] && end?.lng === endPoint[1]) ||
          (start?.lat === endPoint[0] && start?.lng === endPoint[1] && end?.lat === startPoint[0] && end?.lng === startPoint[1])) &&
        incident.blocked;

      if (match) {
        console.log(`Segment bloqué détecté : ${incident.startPoint} -> ${incident.endPoint}`);
      }

      return match;
    });
  }

  private updateVeloMarker(idVelo: number, position: { lat: number; lng: number }): void {
    const marker = this.markersMap[`velo-${idVelo}`];
    if (marker && marker instanceof L.Marker) {
      marker.setLatLng([position.lat, position.lng]); // Met à jour la position du marqueur
      this.map.panTo([position.lat, position.lng], { animate: true }); // Centre la carte sur la position mise à jour
    } else {
      console.error(`Marqueur pour le vélo ${idVelo} introuvable.`);
    }
  }

  private addVeloMarkers(): void {
    this.veloService.getVelosWithPosition().subscribe(velos => {
      this.velos = velos; // Stocker la liste des vélos
      velos.forEach(velo => {
        if (velo.position) {
          const { lat, lng } = velo.position; // Suppression de parsePosition
          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: '/content/images/velo.ico', // Assurez-vous que ce chemin est correct
              iconSize: [32, 32],
            }),
          }).addTo(this.map);

          marker.bindPopup(
            `<b>Vélo ${velo.idVelo}</b><br>Autonomie: ${velo.autonomie} km<br>Capacité: ${velo.capacite} kg<br>État: ${velo.etat}`,
          );
          this.markersMap[`velo-${velo.idVelo}`] = marker; // Stocker les marqueurs par ID de vélo
        }
      });
    });
  }

  resolveIncident(id: number): void {
    if (!id) {
      console.error("ID de l'incident non défini.");
      return;
    }

    console.log(`Tentative de résolution de l'incident ${id}`);

    this.incidentService.resolveIncident(id).subscribe({
      next: () => {
        alert('Incident résolu.');
        this.loadIncidents(); // Recharge les incidents après résolution
      },
      error: (err: any) => {
        console.error("Erreur lors de la résolution de l'incident :", err);
      },
    });
  }
}
