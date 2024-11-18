import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Velo } from './velo.model';

@Injectable({
  providedIn: 'root',
})
export class VeloService {
  private baseUrl = '/api/velo';

  constructor(private http: HttpClient) {}

  // Obtenir tous les vélos
  getVelos(): Observable<Velo[]> {
    return this.http.get<Velo[]>(this.baseUrl);
  }

  // Ajouter un nouveau vélo
  addVelo(velo: Velo): Observable<Velo> {
    return this.http.post<Velo>(this.baseUrl, velo);
  }

  // Supprimer un vélo
  deleteVelo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Récupérer la position des vélos
  getVelosWithPosition(): Observable<Velo[]> {
    return this.http.get<Velo[]>(`${this.baseUrl}?includePosition=true`);
  }
}
