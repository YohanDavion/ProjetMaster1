import { Component, OnInit } from '@angular/core';
import { IncidentService } from 'app/incident/incident.service';
import { Incident } from 'app/incident/incident.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArretService } from 'app/arret.service'; // Service pour récupérer les arrêts

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule], // Import des modules nécessaires
  selector: 'app-incident-list',
  templateUrl: './incident-list.component.html',
  styleUrls: ['./incident-list.component.scss'],
})
export class IncidentListComponent implements OnInit {
  incidents: Incident[] = [];
  filteredIncidents: Incident[] = [];
  filter: 'all' | 'resolved' | 'active' = 'all'; // Valeur par défaut du filtre
  arrets: string[] = []; // Liste des arrêts disponibles

  // Propriétés pour le formulaire d'ajout
  newIncident: Incident = {
    id: undefined,
    startPoint: '',
    endPoint: '',
    blocked: true,
    createdAt: undefined,
    resolvedAt: undefined,
  };

  constructor(
    private incidentService: IncidentService,
    private arretService: ArretService,
  ) {}

  ngOnInit(): void {
    this.loadIncidents();
    this.loadArrets();
  }

  loadIncidents(): void {
    this.incidentService.getAllIncidents().subscribe({
      next: (data: Incident[]) => {
        console.log('Incidents récupérés :', data);
        this.incidents = data;
        this.applyFilter(); // Mettre à jour les incidents filtrés après chargement
      },
      error: err => console.error('Erreur lors du chargement des incidents :', err),
    });
  }

  loadArrets(): void {
    this.arretService.getArrets().subscribe({
      next: data => {
        this.arrets = data.map(arret => arret.nom); // Récupérer les noms des arrêts
      },
      error: err => {
        console.error('Erreur lors du chargement des arrêts:', err);
      },
    });
  }

  applyFilter(): void {
    if (this.filter === 'all') {
      this.filteredIncidents = this.incidents;
    } else if (this.filter === 'resolved') {
      this.filteredIncidents = this.incidents.filter(incident => !incident.blocked);
    } else if (this.filter === 'active') {
      this.filteredIncidents = this.incidents.filter(incident => incident.blocked);
    }
  }

  resolveIncident(id: number): void {
    this.incidentService.resolveIncident(id).subscribe({
      next: () => {
        alert('Incident résolu avec succès.');
        this.loadIncidents(); // Recharge les incidents après résolution
      },
      error: err => console.error('Erreur lors de la résolution de l’incident :', err),
    });
  }

  addIncident(): void {
    this.incidentService.addIncident(this.newIncident).subscribe({
      next: () => {
        alert('Incident ajouté avec succès.');
        // Réinitialiser le formulaire après ajout
        this.newIncident = {
          id: undefined,
          startPoint: '',
          endPoint: '',
          blocked: true,
          createdAt: undefined,
          resolvedAt: undefined,
        };
        this.loadIncidents(); // Recharge les incidents après ajout
      },
      error: err => console.error('Erreur lors de l’ajout de l’incident :', err),
    });
  }
}
