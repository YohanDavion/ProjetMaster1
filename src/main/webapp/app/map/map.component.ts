import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { routes } from '../points-interet';
import { ArretService, PointInteret } from '../arret.service'; // Importez l'interface et le service

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
  public pointsInteret: { name: string; lat: number; lng: number }[] = [];

  constructor(private arretService: ArretService) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPointsInteret();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [48.8566, 2.3522],
      zoom: 12,
      minZoom: 12, // Niveau de zoom minimum défini sur le niveau de zoom par défaut
      maxZoom: 19, // Niveau de zoom maximum, vous pouvez ajuster cela si nécessaire
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
              name: arret.nom,
              lat: lat,
              lng: lng,
            };
          }
          return null;
        })
        .filter((point): point is { name: string; lat: number; lng: number } => point !== null);

      this.addMarkers();
      this.drawRoads();
    });
  }

  private addMarkers(): void {
    this.pointsInteret.forEach(point => {
      let markerOptions: L.CircleMarkerOptions = {
        radius: 5,
        color: 'red',
        fillOpacity: 0.5,
      };

      if (point.name === "Porte d'Ivry") {
        markerOptions = {
          radius: 10,
          color: 'green',
          fillOpacity: 0.8,
        };
      }

      const marker = L.circleMarker([point.lat, point.lng], markerOptions).addTo(this.map);

      marker.bindPopup(`<b>${point.name}</b><br>Cliquez pour plus de détails.`);

      marker.on('click', () => {
        this.highlightMarker(point.name);
      });

      this.markersMap[point.name] = marker;
    });
  }

  private drawRoads(): void {
    Object.keys(routes).forEach(road => {
      const points = routes[road]
        .map(name => {
          const point = this.pointsInteret.find(p => p.name === name);
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
}
