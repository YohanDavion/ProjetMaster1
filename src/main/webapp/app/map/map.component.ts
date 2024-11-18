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
  private markersMap: { [key: string]: L.CircleMarker } = {};
  private selectedMarker: L.CircleMarker | null = null;
  private selectedPolyline: L.Polyline | null = null;
  private allPolylines: L.Polyline[] = [];
  public pointsInteret: (PointInteret & { lat: number; lng: number })[] = [];

  constructor(
    private arretService: ArretService,
    private veloService: VeloService, // Injection du service ici
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPointsInteret();
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
    if (this.selectedMarker) {
      this.selectedMarker.setStyle({ color: 'red' });
    }

    const marker = this.markersMap[pointName];
    if (marker) {
      marker.setStyle({ color: 'blue' });
      marker.openPopup();
      this.selectedMarker = marker;
      this.map.panTo(marker.getLatLng());
    }
  }

  private addVeloMarkers(): void {
    this.veloService.getVelosWithPosition().subscribe(velos => {
      velos.forEach(velo => {
        if (velo.position) {
          const { lat, lng } = velo.position; // Pas besoin de parsePosition
          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: '/velo.icon.png', // Chemin vers une icône personnalisée
              iconSize: [32, 32],
            }),
          }).addTo(this.map);

          marker.bindPopup(
            `<b>Vélo ${velo.idVelo}</b><br>Autonomie: ${velo.autonomie} km<br>Capacité: ${velo.capacite} kg<br>État: ${velo.etat}`,
          );
        }
      });
    });
  }

  private moveVelo(velo: Velo, path: { lat: number; lng: number }[]): void {
    let index = 0;
    const interval = setInterval(() => {
      if (index < path.length) {
        const position = path[index];
        velo.position = position; // Mise à jour de la position
        this.updateVeloMarker(velo.idVelo!, position); // Mise à jour du marqueur
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1000); // Déplacement toutes les 1 seconde
  }

  private updateVeloMarker(idVelo: number, position: { lat: number; lng: number }): void {
    const marker = this.markersMap[`velo-${idVelo}`];
    if (marker) {
      marker.setLatLng([position.lat, position.lng]);
    }
  }
}
