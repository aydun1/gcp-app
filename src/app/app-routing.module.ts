import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { FailedComponent } from './failed/failed.component';
import { HomeComponent } from './home/home.component';
import { LogoutComponent } from './logout/logout.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login-failed',
    component: FailedComponent
  },
  {
    path: 'logout',
    component: LogoutComponent
  },
  { path: 'customers', canActivate: [MsalGuard], loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule) },
  { path: 'recycling', canActivate: [MsalGuard], loadChildren: () => import('./recycling/recycling.module').then(m => m.RecyclingModule) },
  { path: 'pallets', canActivate: [MsalGuard], loadChildren: () => import('./pallets/pallets.module').then(m => m.PalletsModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
