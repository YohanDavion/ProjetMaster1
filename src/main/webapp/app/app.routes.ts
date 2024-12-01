import { Routes } from '@angular/router';

import { Authority } from 'app/config/authority.constants';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { errorRoute } from './layouts/error/error.route';

import HomeComponent from './home/home.component';
import NavbarComponent from './layouts/navbar/navbar.component';
import LoginComponent from './login/login.component';
import { MapComponent } from './map/map.component';
import { RouteCalculatorComponent } from './route-calculator/route-calculator.component';
import { VeloComponent } from './velo/velo.component';
import { IncidentListComponent } from './incident/incident-list/incident-list.component';
import { TourneeComponent } from './tournee/tournee.component';
import { VeloTourneeComponent } from './velo-tournee/velo-tournee.component';
import { MapTourneeComponent } from './map-tournee/map-tournee.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'home.title',
  },
  {
    path: '',
    component: NavbarComponent,
    outlet: 'navbar',
  },
  {
    path: 'admin',
    data: {
      authorities: [Authority.ADMIN],
    },
    canActivate: [UserRouteAccessService],
    loadChildren: () => import('./admin/admin.routes'),
  },
  {
    path: 'account',
    loadChildren: () => import('./account/account.route'),
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'login.title',
  },
  {
    path: 'map',
    component: MapComponent,
    title: 'Map',
  },
  {
    path: 'calculer-trajet',
    component: RouteCalculatorComponent,
    title: 'Calculer Trajet',
  },
  {
    path: 'velo',
    component: VeloComponent,
    title: 'Velo',
  },
  {
    path: 'incidents',
    component: IncidentListComponent,
  },
  {
    path: '',
    loadChildren: () => import(`./entities/entity.routes`),
  },
  {
    path: 'tournees',
    component: TourneeComponent,
  },
  {
    path: 'velo/:id',
    component: VeloTourneeComponent,
  },
  {
    path: 'map-tournee',
    component: MapTourneeComponent,
  },
  ...errorRoute,
];

export default routes;
