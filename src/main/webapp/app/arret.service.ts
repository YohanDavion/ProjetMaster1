import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PointInteret {
  idArret: number;
  nom: string;
  lat: number;
  lng: number;
  position?: string; // Ajouter ce champ si nécessaire
  poubelleVidee: boolean;
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

  viderPoubelle(id: number): Observable<void> {
    return this.http.put<void>(`/api/arrets/${id}/vider`, {});
  }
}
