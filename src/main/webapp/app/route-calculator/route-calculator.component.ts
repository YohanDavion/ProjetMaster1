import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArretService, PointInteret } from '../arret.service';
import { routes } from '../points-interet';

@Component({
  standalone: true,
  selector: 'app-route-calculator',
  templateUrl: './route-calculator.component.html',
  styleUrls: ['./route-calculator.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class RouteCalculatorComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private markersMap: { [key: string]: L.CircleMarker } = {};
  private selectedRoute: L.Polyline | null = null;
  private allPolylines: L.Polyline[] = [];
  public pointsInteret: PointInteret[] = [];
  public roadsVisible = true;

  public startPoint: PointInteret | null = null;
  public endPoint: PointInteret | null = null;

  constructor(private arretService: ArretService) {}

  ngOnInit(): void {
    this.initMap();
    this.loadPointsInteret();
  }

  ngAfterViewInit(): void {
    // La carte est initialisée dans ngOnInit, donc pas besoin de la réinitialiser ici
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
              nom: arret.nom,
              lat: lat,
              lng: lng,
            };
          }
          return null;
        })
        .filter((point): point is PointInteret => point !== null);

      this.addMarkers();
      this.drawRoads();

      // Initialiser startPoint et endPoint à "Porte d'Ivry"
      this.startPoint = this.pointsInteret.find(point => point.nom === "Porte d'Ivry") || this.pointsInteret[0];
      this.endPoint = this.startPoint;
    });
  }

  private addMarkers(): void {
    this.pointsInteret.forEach(point => {
      let markerOptions: L.CircleMarkerOptions = {
        radius: 5,
        color: 'red',
        fillOpacity: 0.5,
      };

      if (point.nom === "Porte d'Ivry") {
        markerOptions = {
          radius: 10,
          color: 'green',
          fillOpacity: 0.8,
        };
      }

      const marker = L.circleMarker([point.lat, point.lng], markerOptions).addTo(this.map);

      marker.bindPopup(`<b>${point.nom}</b><br>Cliquez pour sélectionner ce point.`);

      marker.on('click', () => {
        this.selectPoint(marker, point);
      });

      this.markersMap[point.nom] = marker;
    });
  }

  private selectPoint(marker: L.CircleMarker, point: PointInteret): void {
    if (!this.startPoint) {
      this.startPoint = point;
      marker.setStyle({ color: 'blue' });
      marker.bindPopup(`<b>${point.nom}</b><br>Point de départ sélectionné.`).openPopup();
    } else if (!this.endPoint) {
      this.endPoint = point;
      marker.setStyle({ color: 'green' });
      marker.bindPopup(`<b>${point.nom}</b><br>Point d'arrivée sélectionné.`).openPopup();
      this.calculateRoute(this.startPoint, this.endPoint);
    } else {
      this.resetSelection();
      this.selectPoint(marker, point);
    }
  }

  private resetSelection(): void {
    if (this.startPoint) {
      const marker = this.markersMap[this.startPoint.nom];
      marker.setStyle({ color: 'red' });
      this.startPoint = null;
    }
    if (this.endPoint) {
      const marker = this.markersMap[this.endPoint.nom];
      marker.setStyle({ color: 'red' });
      this.endPoint = null;
    }
    if (this.selectedRoute) {
      this.map.removeLayer(this.selectedRoute);
      this.selectedRoute = null;
    }
  }

  public calculateRoute(start: PointInteret, end: PointInteret): void {
    const queue: string[][] = [[start.nom]];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const path = queue.shift()!;
      const lastNode = path[path.length - 1];

      if (lastNode === end.nom) {
        this.drawRoute(path);
        return;
      }

      if (!visited.has(lastNode)) {
        visited.add(lastNode);

        const neighbors = this.getAllNeighbors(lastNode);

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push([...path, neighbor]);
          }
        }
      }
    }

    alert('Aucun chemin trouvé entre les points spécifiés.');
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

  private drawRoute(path: string[]): void {
    if (!this.map) {
      console.error("La carte n'est pas initialisée.");
      return;
    }

    const latlngs = path
      .map(name => {
        const point = this.pointsInteret.find(p => p.nom === name);
        return point ? [point.lat, point.lng] : null;
      })
      .filter((p): p is [number, number] => p !== null);

    if (!latlngs.length) {
      console.error('Le chemin des latitudes et longitudes est vide ou mal formé.');
      return;
    }

    if (this.selectedRoute) {
      this.map.removeLayer(this.selectedRoute);
    }

    this.allPolylines.forEach(line => this.map.removeLayer(line));

    if (this.roadsVisible) {
      this.allPolylines.forEach(line => this.map.addLayer(line));
    }

    this.selectedRoute = L.polyline(latlngs, { color: 'blue', weight: 6 });
    this.map.addLayer(this.selectedRoute);
    this.map.fitBounds(this.selectedRoute.getBounds());

    const distance = (latlngs.length - 1) * 0.5;
    alert(`Trajet calculé : ${latlngs.length - 1} arrêts, ${distance} km`);
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
      }
    });
  }

  public toggleRoadsVisibility(): void {
    this.roadsVisible = !this.roadsVisible;
    this.allPolylines.forEach(line => {
      if (this.roadsVisible) {
        this.map.addLayer(line);
      } else {
        this.map.removeLayer(line);
      }
    });
  }
}
