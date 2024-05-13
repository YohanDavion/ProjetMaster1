import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [MenubarModule,ButtonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  items: MenuItem[] = []; 
  ngOnInit(): void {
    this.items = [ 
      { 
        label: 'Accueil', 
        routerLink: ['/accueil'],
                routerLinkActiveOptions: {
                  exact: true
                }
      },
      { 
          label: 'Cyclistes', 
          items: [ 
            { 
                label: '1',
            }, 
            { 
                label: '2',
            } 
          ] 
      }, 
      { 
          label: 'Gestionnaire de Réseau', 

          items: [ 
            { 
                label: '1',
            }, 
            { 
                label: '2',
            } 
          ] 
      },
      { 
        label: 'Ressources Humaines', 

        items: [ 
          { 
              label: 'Gestions Utilisateurs',
              routerLink: ['/rh/gestion-utilisateurs'],
                routerLinkActiveOptions: {
                  exact: true
                }
          }, 
          { 
              label: '2',
          } 
        ] 
    } 
    ];  
  }
}
