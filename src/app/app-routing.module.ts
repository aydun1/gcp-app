import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { HomeComponent } from './home/home.component';
import { LogoutComponent } from './logout/logout.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'logout',
    component: LogoutComponent
  },
  { path: 'customers', canActivate: [MsalGuard], loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule) },
  { path: 'recycling', canActivate: [MsalGuard], loadChildren: () => import('./recycling/recycling.module').then(m => m.RecyclingModule) },
  { path: 'pallets', canActivate: [MsalGuard], loadChildren: () => import('./pallets/pallets.module').then(m => m.PalletsModule) },
  { path: 'runs', canActivate: [MsalGuard], loadChildren: () => import('./runs/runs.module').then(m => m.RunsModule) },
  { path: 'transfers', canActivate: [MsalGuard], loadChildren: () => import('./interstate-transfers/interstate-transfers.module').then(m => m.InterstateTransfersModule) },
  { path: 'loading-schedule', canActivate: [MsalGuard], loadChildren: () => import('./loading-schedule/loading-schedule.module').then(m => m.LoadingScheduleModule) }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
