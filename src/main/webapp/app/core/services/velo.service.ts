import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Velo } from '../../entities/velo.model';

@Injectable({
  providedIn: 'root',
})
export class VeloService {
  private apiUrl = 'http://localhost:8080/api/velos'; // Assurez-vous que l'URL est correcte

  constructor(private http: HttpClient) {}

  getAll(): Observable<Velo[]> {
    return this.http.get<Velo[]>(this.apiUrl);
  }

  create(velo: Velo): Observable<Velo> {
    return this.http.post<Velo>(this.apiUrl, velo);
  }

  update(velo: Velo): Observable<Velo> {
    return this.http.put<Velo>(`${this.apiUrl}/${velo.idvelo}`, velo);
  }

  find(id: number): Observable<Velo> {
    return this.http.get<Velo>(`${this.apiUrl}/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
