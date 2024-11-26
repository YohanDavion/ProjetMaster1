import { PointInteret } from 'app/arret.service';

export class Velo {
  idVelo?: number;
  autonomie: number = 50; // Autonomie initiale (modifiée si hiver)
  capaciteRestante: number = 200; // Charge maximale
  capacite: number = 0; // Charge actuelle en kg
  etat?: string;
  position?: { lat: number; lng: number }; // Nouvelle propriété pour la position
  routeName?: string; // Ajoutez cette propriété
  startPoint?: PointInteret; // Point de départ pour le déplacement
  endPoint?: PointInteret; // Point d'arrivée pour le déplacement
  mode: 'ramassage' | 'route' = 'ramassage'; // Mode de fonctionnement
}
