import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { routes } from '../points-interet';
import { ArretService, PointInteret } from '../arret.service'; // Importez l'interface et le service
import { Velo } from 'app/velo/velo.model';
import { VeloService } from '../velo/velo.service'; // Assurez-vous que le chemin est correct

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  private map!: L.Map;
  private markersMap: { [key: string]: L.Marker | L.CircleMarker } = {};
  private selectedMarker: L.CircleMarker | null = null;
  private selectedPolyline: L.Polyline | null = null;
  private allPolylines: L.Polyline[] = [];
  public pointsInteret: (PointInteret & { lat: number; lng: number })[] = [];
  public velos: Velo[] = []; // Liste des vélos pour l'affichage

  constructor(
    private arretService: ArretService,
    private veloService: VeloService, // Injection du service ici
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPointsInteret();
    this.addVeloMarkers(); // Ajoutez cette ligne
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

  public viderPoubelle(id: number): void {
    this.arretService.viderPoubelle(id).subscribe(() => {
      alert('Poubelle vidée avec succès');
      this.reloadMarkers();
    });
  }

  private reloadMarkers(): void {
    this.loadPointsInteret(); // Recharge les points pour actualiser leur statut
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
        const polyline = L.polyline(points, { color: 'grey', weight: 4 }).addTo(this.map);
        this.allPolylines.push(polyline);

        polyline.on('click', () => {
          this.highlightRoad(polyline);
        });
      }
    });
  }

  private highlightRoad(polyline: L.Polyline): void {
    this.allPolylines.forEach(line => this.map.removeLayer(line));
    this.selectedPolyline = polyline;
    polyline.setStyle({ color: 'blue' });
    this.map.addLayer(polyline);
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
    // Exemple de logique pour générer un chemin entre deux points.
    const path: { lat: number; lng: number }[] = [];
    const route = routes['default']; // Assurez-vous que `routes` contient les données nécessaires.

    route.forEach(name => {
      const point = this.pointsInteret.find(p => p.nom === name);
      if (point) {
        path.push({ lat: point.lat, lng: point.lng });
      }
    });

    return path.length > 0 ? path : [start, { lat: end.lat, lng: end.lng }];
  }

  private moveVelo(velo: Velo): void {
    if (!velo.routeName || !routes[velo.routeName]) {
      console.error(`Route non définie pour le vélo ${velo.idVelo}`);
      return;
    }

    const route = routes[velo.routeName]
      .map(pointName => {
        const point = this.pointsInteret.find(p => p.nom === pointName);
        return point ? { lat: point.lat, lng: point.lng } : null;
      })
      .filter((point): point is { lat: number; lng: number } => point !== null);

    let index = 0;
    const interval = setInterval(() => {
      if (index < route.length) {
        const position = route[index];
        velo.position = position; // Met à jour la position dans le modèle
        this.updateVeloMarker(velo.idVelo!, position); // Met à jour le marqueur sur la carte
        index++;
      } else {
        clearInterval(interval); // Arrête le déplacement à la fin du chemin
      }
    }, 1000); // Déplacement toutes les secondes
  }
  private updateVeloMarker(idVelo: number, position: { lat: number; lng: number }): void {
    const marker = this.markersMap[`velo-${idVelo}`];
    if (marker && marker instanceof L.Marker) {
      marker.setLatLng([position.lat, position.lng]); // Met à jour la position du marqueur
    }
  }

  public startMovingVelo(idVelo: number): void {
    const velo = this.velos.find(v => v.idVelo === idVelo);
    if (velo) {
      this.moveVelo(velo);
    }
  }
}
