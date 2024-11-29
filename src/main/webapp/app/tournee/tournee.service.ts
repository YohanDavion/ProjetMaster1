import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PointInteret } from 'app/arret.service';

@Injectable({
  providedIn: 'root',
})
export class TourneeService {
  private tournees = new BehaviorSubject<{ [key: number]: PointInteret[][] }>({}); // Stockage des tournées

  setTournees(tournees: { [key: number]: PointInteret[][] }): void {
    this.tournees.next(tournees);
  }

  getTournees(): { [key: number]: PointInteret[][] } {
    return this.tournees.getValue();
  }

  getTourneesForVelo(idVelo: number): PointInteret[][] {
    return this.tournees.getValue()[idVelo] || [];
  }
}
