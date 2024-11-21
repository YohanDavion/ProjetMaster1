import { PointInteret } from 'app/arret.service';

export class Velo {
  idVelo?: number;
  autonomie?: number;
  capacite?: number;
  etat?: string;
  position?: { lat: number; lng: number }; // Nouvelle propriété pour la position
  routeName?: string; // Ajoutez cette propriété
  startPoint?: PointInteret; // Point de départ pour le déplacement
  endPoint?: PointInteret; // Point d'arrivée pour le déplacement
}
