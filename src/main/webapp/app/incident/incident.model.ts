export interface Incident {
  id?: number; // Rendre id optionnel
  startPoint: string; // Nom du point de départ
  endPoint: string; // Nom du point d'arrivée
  blocked: boolean; // Si l'incident est actif ou non
  createdAt?: string; // Date de création
  resolvedAt?: string; // Date de résolution
}
