import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { pointsInteret, routes, PointInteret } from '../points-interet';

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
  private allPolylines: L.Polyline[] = []; // Stocke toutes les polylines grises
  public pointsInteret = pointsInteret;
  public roadsVisible = true; // Suivi de la visibilité des routes grises

  public startPoint: PointInteret | null = null;
  public endPoint: PointInteret | null = null;

  ngOnInit(): void {
    // Réorganiser les points d'intérêt pour que "Porte d'Ivry" soit en premier
    this.pointsInteret = pointsInteret.sort((a, b) => {
      if (a.name === "Porte d'Ivry") return -1;
      if (b.name === "Porte d'Ivry") return 1;
      return 0;
    });

    // Initialiser startPoint et endPoint à "Porte d'Ivry"
    this.startPoint = this.pointsInteret[0];
    this.endPoint = this.pointsInteret[0];
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.addMarkers();
    this.drawRoads();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [48.8566, 2.3522],
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.7,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
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

  private addMarkers(): void {
    this.pointsInteret.forEach(point => {
      let markerOptions: L.CircleMarkerOptions = {
        radius: 5,
        color: 'red',
        fillOpacity: 0.5,
      };

      // Style spécial pour "Porte d’Ivry"
      if (point.name === "Porte d'Ivry") {
        markerOptions = {
          radius: 10, // Plus grand rayon pour l'emphase
          color: 'green', // Couleur différente pour l'emphase
          fillOpacity: 0.8,
        };
      }

      const marker = L.circleMarker([point.lat, point.lng], markerOptions).addTo(this.map);

      marker.bindPopup(`<b>${point.name}</b><br>Cliquez pour sélectionner ce point.`);

      marker.on('click', () => {
        this.selectPoint(marker, point);
      });

      this.markersMap[point.name] = marker;
    });
  }

  private selectPoint(marker: L.CircleMarker, point: PointInteret): void {
    if (!this.startPoint) {
      this.startPoint = point;
      marker.setStyle({ color: 'blue' });
      marker.bindPopup(`<b>${point.name}</b><br>Point de départ sélectionné.`).openPopup();
    } else if (!this.endPoint) {
      this.endPoint = point;
      marker.setStyle({ color: 'green' });
      marker.bindPopup(`<b>${point.name}</b><br>Point d'arrivée sélectionné.`).openPopup();
      this.calculateRoute(this.startPoint, this.endPoint);
    } else {
      this.resetSelection();
      this.selectPoint(marker, point);
    }
  }

  private resetSelection(): void {
    if (this.startPoint) {
      const marker = this.markersMap[this.startPoint.name];
      marker.setStyle({ color: 'red' });
      this.startPoint = null;
    }
    if (this.endPoint) {
      const marker = this.markersMap[this.endPoint.name];
      marker.setStyle({ color: 'red' });
      this.endPoint = null;
    }
    if (this.selectedRoute) {
      this.map.removeLayer(this.selectedRoute);
      this.selectedRoute = null;
    }
  }

  public calculateRoute(start: PointInteret, end: PointInteret): void {
    const queue: string[][] = [[start.name]];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const path = queue.shift()!;
      const lastNode = path[path.length - 1];

      if (lastNode === end.name) {
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

    const latlngs = path.map(name => {
      const point = this.pointsInteret.find(p => p.name === name);
      return [point!.lat, point!.lng];
    }) as [number, number][];

    if (!latlngs.length) {
      console.error('Le chemin des latitudes et longitudes est vide ou mal formé.');
      return;
    }

    // Supprimer la route actuellement sélectionnée, le cas échéant
    if (this.selectedRoute) {
      this.map.removeLayer(this.selectedRoute);
    }

    // Masquer toutes les routes grises
    this.allPolylines.forEach(line => this.map.removeLayer(line));

    // Ajouter à nouveau les routes grises si elles sont configurées pour être visibles
    if (this.roadsVisible) {
      this.allPolylines.forEach(line => this.map.addLayer(line));
    }

    // Dessiner la route sélectionnée en bleu et l'ajouter à la carte après les routes grises
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
          const point = this.pointsInteret.find(p => p.name === name);
          return point ? [point.lat, point.lng] : null;
        })
        .filter((p): p is [number, number] => p !== null);

      if (points.length > 1) {
        const polyline = L.polyline(points, { color: 'grey', weight: 4 }).addTo(this.map);
        this.allPolylines.push(polyline); // Stocker toutes les polylines grises
      }
    });
  }
}
