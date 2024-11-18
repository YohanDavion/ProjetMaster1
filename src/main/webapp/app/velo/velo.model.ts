export class Velo {
  idVelo?: number;
  autonomie?: number;
  capacite?: number;
  etat?: string;
  position?: { lat: number; lng: number }; // Nouvelle propriété pour la position
  routeName?: string; // Ajoutez cette propriété
}
