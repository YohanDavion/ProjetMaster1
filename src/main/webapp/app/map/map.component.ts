import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { pointsInteret, routes } from '../points-interet';

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
  public pointsInteret = pointsInteret;

  ngOnInit(): void {
    this.initMap();
    this.addMarkers();
    this.drawRoads();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [48.8566, 2.3522],
      zoom: 13,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.7, // Adjust the opacity for transparency
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  private addMarkers(): void {
    this.pointsInteret.forEach(point => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 5, // Reduced radius for smaller markers
        color: 'red',
        fillOpacity: 0.5,
      }).addTo(this.map);

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
        this.allPolylines.push(polyline); // Store all polylines

        polyline.on('click', () => {
          this.highlightRoad(polyline);
        });
      }
    });
  }

  private highlightRoad(polyline: L.Polyline): void {
    // Hide all polylines first
    this.allPolylines.forEach(line => this.map.removeLayer(line));

    // Highlight the selected polyline
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
