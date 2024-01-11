import { Route } from '@angular/router';
import { MsalGuard, MsalRedirectComponent } from '@azure/msal-angular';

import { HomeComponent } from './home/home.component';
import { LogoutComponent } from './logout/logout.component';

export const routes: Route[] = [
  { path: '', loadChildren: () => [{path: '', component: HomeComponent}] },
  { path: 'auth', loadChildren: () => [{path: '', component: MsalRedirectComponent}] },
  { path: 'logout', loadChildren: () => [{path: '', component: LogoutComponent}] },
  { path: 'customers', canActivate: [MsalGuard], loadChildren: () => import('./customers/routes') },
  { path: 'recycling', canActivate: [MsalGuard], loadChildren: () => import('./recycling/routes') },
  { path: 'pallets', canActivate: [MsalGuard], loadChildren: () => import('./pallets/routes') },
  { path: 'runs', canActivate: [MsalGuard], loadChildren: () => import('./runs/routes') },
  { path: 'chemicals', canActivate: [MsalGuard], loadChildren: () => import('./chemicals/routes') },
  { path: 'transfers', canActivate: [MsalGuard], loadChildren: () => import('./interstate-transfers/routes') },
  { path: 'loading-schedule', canActivate: [MsalGuard], loadChildren: () => import('./loading-schedule/routes') },
];