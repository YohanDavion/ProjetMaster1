import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { routes } from '../points-interet';
import { ArretService, PointInteret } from '../arret.service'; // Importez l'interface et le service
import { Velo } from 'app/velo/velo.model';
import { VeloService } from '../velo/velo.service'; // Assurez-vous que le chemin est correct
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Incident } from 'app/incident/incident.model';
import { IncidentService } from 'app/incident/incident.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule], // Import nécessaire pour les directives Angular telles que *ngFor
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  public startPoint: PointInteret | null = null; // Point de départ sélectionné
  public endPoint: PointInteret | null = null; // Point d'arrivée sélectionné
  private map!: L.Map;
  private markersMap: { [key: string]: L.Marker | L.CircleMarker } = {};
  private selectedMarker: L.CircleMarker | null = null;
  private selectedPolyline: L.Polyline | null = null;
  private allPolylines: L.Polyline[] = [];
  public pointsInteret: (PointInteret & { lat: number; lng: number })[] = [];
  public velos: Velo[] = []; // Liste des vélos pour l'affichage

  constructor(
    private arretService: ArretService,
    private veloService: VeloService,
    private incidentService: IncidentService, // Ajoutez ici si manquant
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPointsInteret();
    this.addVeloMarkers();
    this.loadIncidents(); // Charger les incidents actifs au démarrage
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [48.8566, 2.3522],
      zoom: 12,
      minZoom: 12, // Niveau de zoom minimum
      maxZoom: 19, // Niveau de zoom maximum
      maxBounds: [
        [48.5, 2.0], // Limite sud-ouest
        [49.0, 2.7], // Limite nord-est
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
            return {
              ...arret, // Inclut toutes les propriétés de l'objet Arret
              lat,
              lng,
            };
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
      let markerOptions: L.CircleMarkerOptions = {
        radius: 5,
        color: point.poubelleVidee ? 'grey' : 'red', // Bleu si vidé, rouge sinon
        fillOpacity: 0.5,
      };

      // Style spécial pour "Porte d'Ivry"
      if (point.nom === "Porte d'Ivry") {
        markerOptions = {
          radius: 10, // Rayon plus grand pour mettre en valeur
          color: 'green', // Couleur différente
          fillOpacity: 0.8, // Plus opaque pour attirer l'attention
        };
      }

      const marker = L.circleMarker([point.lat, point.lng], markerOptions).addTo(this.map);

      marker.bindPopup(`<b>${point.nom}</b><br>Poubelle : ${point.poubelleVidee ? 'Vide' : 'Pleine'}`);

      marker.on('click', () => {
        this.highlightMarker(point.nom);
      });

      this.markersMap[point.nom] = marker;
    });
  }

  private drawRoads(): void {
    console.log('Incidents actifs :', this.incidents);

    Object.keys(routes).forEach(road => {
      const points = routes[road]
        .map(name => {
          const point = this.pointsInteret.find(p => p.nom === name);
          return point ? [point.lat, point.lng] : null;
        })
        .filter((p): p is [number, number] => p !== null);

      console.log(`Route "${road}" segments :`, points);

      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const startPoint = points[i];
          const endPoint = points[i + 1];

          const isBlocked = this.isSegmentBlocked(startPoint, endPoint);

          console.log(`Segment : ${startPoint} -> ${endPoint}, Bloqué : ${isBlocked}`);

          const polyline = L.polyline([startPoint, endPoint], {
            color: isBlocked ? 'red' : 'grey',
            weight: 4,
          }).addTo(this.map);

          this.allPolylines.push(polyline);
        }
      }
    });
  }

  private isSegmentBlocked(startPoint: [number, number], endPoint: [number, number]): boolean {
    return this.incidents.some(incident => {
      const start = this.pointsInteret.find(p => p.nom === incident.startPoint);
      const end = this.pointsInteret.find(p => p.nom === incident.endPoint);

      return (
        start?.lat === startPoint[0] &&
        start?.lng === startPoint[1] &&
        end?.lat === endPoint[0] &&
        end?.lng === endPoint[1] &&
        incident.blocked
      );
    });
  }

  public deselectRoute(): void {
    if (this.selectedPolyline) {
      this.selectedPolyline.setStyle({ color: 'grey' });
      this.selectedPolyline = null;
    }
    this.allPolylines.forEach(line => this.map.addLayer(line));
  }

  public highlightMarker(pointName: string): void {
    const marker = this.markersMap[pointName];
    if (marker) {
      if (this.selectedMarker) {
        if (this.selectedMarker instanceof L.CircleMarker) {
          this.selectedMarker.setStyle({ color: 'red' });
        }
      }

      if (marker instanceof L.CircleMarker) {
        marker.setStyle({ color: 'blue' });
      }

      marker.openPopup();
      this.selectedMarker = marker instanceof L.CircleMarker ? marker : null;
      this.map.panTo(marker.getLatLng());
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

  private getPath(start: { lat: number; lng: number }, end: PointInteret & { lat: number; lng: number }): { lat: number; lng: number }[] {
    const path: { lat: number; lng: number }[] = [];
    const route = routes['default']; // Vérifier si une route "default" existe

    if (route) {
      route.forEach(name => {
        const point = this.pointsInteret.find(p => p.nom === name);
        if (point) {
          path.push({ lat: point.lat, lng: point.lng });
        }
      });
    }

    if (path.length === 0) {
      // Si aucun chemin trouvé, utiliser un chemin direct
      return [start, { lat: end.lat, lng: end.lng }];
    }

    path.push({ lat: end.lat, lng: end.lng });
    return path;
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

      const route = this.calculateRoute(startPoint, destination);
      console.log(`Route calculée pour le vélo ${idVelo}:`, route);

      this.moveVelo(velo, route);
    } else {
      console.error(`Vélo avec ID ${idVelo} introuvable.`);
    }
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
        idArret: 0, // Valeur fictive ou calculée
        nom: 'Position actuelle', // Description temporaire
        poubelleVidee: false, // Propriété par défaut
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

  newIncident: Incident = { startPoint: '', endPoint: '', blocked: true };
  incidents: Incident[] = [];

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

  loadIncidents(): void {
    this.incidentService.getActiveIncidents().subscribe((data: Incident[]) => {
      this.incidents = data;
      this.drawRoads(); // Redessiner les routes après avoir chargé les incidents
    });
  }

  resolveIncident(id: number): void {
    if (!id) {
      console.error("ID de l'incident non défini.");
      return;
    }

    this.incidentService.resolveIncident(id).subscribe({
      next: () => {
        alert('Incident résolu.');
        this.loadIncidents(); // Recharger les incidents
      },
      error: (err: any) => console.error("Erreur lors de la résolution de l'incident :", err),
    });
  }
}
