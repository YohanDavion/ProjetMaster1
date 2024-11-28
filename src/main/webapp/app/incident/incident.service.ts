import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incident } from './incident.model'; // Assurez-vous du chemin correct

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private readonly apiUrl = '/api/incidents'; // Chemin principal de l'API

  constructor(private http: HttpClient) {}

  getAllIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(this.apiUrl);
  }

  addIncident(incident: Incident): Observable<Incident> {
    return this.http.post<Incident>(this.apiUrl, incident);
  }

  resolveIncident(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/resolve`, null);
  }

  getActiveIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/active`);
  }
}
