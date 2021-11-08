import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { FailedComponent } from './failed/failed.component';

import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { RecyclingComponent } from './recycling/recycling.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  { path: 'customers', loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule) },
  { path: 'recycling', loadChildren: () => import('./recycling/recycling.module').then(m => m.RecyclingModule) },

  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MsalGuard]
  },
  {
    path: 'login-failed',
    component: FailedComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
