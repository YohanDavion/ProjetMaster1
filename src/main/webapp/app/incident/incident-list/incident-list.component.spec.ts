import { Component, OnInit } from '@angular/core';
import { IncidentService } from 'app/incident/incident.service';
import { Incident } from 'app/incident/incident.model';

@Component({
  standalone: true,
  selector: 'app-incident-list',
  templateUrl: './incident-list.component.html',
  styleUrls: ['./incident-list.component.scss'],
})
export class IncidentListComponent implements OnInit {
  incidents: Incident[] = [];
  filteredIncidents: Incident[] = [];
  filter: 'all' | 'resolved' | 'active' = 'all'; // Filtre actif

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.incidentService.getAllIncidents().subscribe({
      next: data => {
        this.incidents = data;
        this.applyFilter();
      },
      error: err => {
        console.error('Erreur lors du chargement des incidents:', err);
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
        alert('Incident résolu.');
        this.loadIncidents(); // Recharge la liste des incidents
      },
      error: err => {
        console.error("Erreur lors de la résolution de l'incident :", err);
      },
    });
  }
}
