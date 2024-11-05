import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PointInteret {
  nom: string;
  lat: number;
  lng: number;
  position?: string; // Ajouter ce champ si nécessaire
}

@Injectable({
  providedIn: 'root',
})
export class ArretService {
  private apiUrl = 'http://localhost:8080/api/arrets'; // URL de l'API

  constructor(private http: HttpClient) {}

  getArrets(): Observable<PointInteret[]> {
    return this.http.get<PointInteret[]>(this.apiUrl);
  }
}
