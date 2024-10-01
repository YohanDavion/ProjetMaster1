import { Component, OnInit } from '@angular/core';
import { VeloService } from './velo.service';
import { Velo } from './velo.model';
import { FormsModule } from '@angular/forms'; // Importer FormsModule
import { CommonModule } from '@angular/common'; // Pour d'autres fonctionnalités communes

@Component({
  selector: 'app-velo',
  templateUrl: './velo.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule], // Ajouter FormsModule ici
})
export class VeloComponent implements OnInit {
  velos: Velo[] = [];
  newVelo: Velo = new Velo();

  constructor(private veloService: VeloService) {}

  ngOnInit(): void {
    this.loadVelos();
  }

  // Charger la liste des vélos
  loadVelos(): void {
    this.veloService.getVelos().subscribe(data => {
      this.velos = data;
    });
  }

  // Ajouter un nouveau vélo
  addVelo(): void {
    this.veloService.addVelo(this.newVelo).subscribe(() => {
      this.loadVelos(); // Recharger la liste des vélos après l'ajout
      this.newVelo = new Velo(); // Réinitialiser le formulaire
    });
  }

  deleteVelo(id: number | undefined): void {
    if (id === undefined) {
      console.error('ID de vélo non défini');
      return;
    }

    this.veloService.deleteVelo(id).subscribe(() => {
      this.loadVelos(); // Recharger la liste des vélos après la suppression
    });
  }
}
