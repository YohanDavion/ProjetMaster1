import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incident } from './incident.model'; // Adaptez le chemin si nécessaire

@Injectable({
  providedIn: 'root', // Permet d'être disponible globalement
})
export class IncidentService {
  private apiUrl = '/api/incidents'; // Adaptez en fonction de votre backend

  constructor(private http: HttpClient) {}

  getActiveIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/active`);
  }

  addIncident(incident: Incident): Observable<Incident> {
    return this.http.post<Incident>(`${this.apiUrl}`, incident);
  }

  resolveIncident(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/resolve`, {});
  }
}
