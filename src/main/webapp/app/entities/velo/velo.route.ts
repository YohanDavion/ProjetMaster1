import { Route } from '@angular/router';
import { VeloListComponent } from './velo-list.component';

export const VeloRoute: Route = {
  path: 'velos',
  component: VeloListComponent,
  data: {
    pageTitle: 'Vélos',
  },
};
