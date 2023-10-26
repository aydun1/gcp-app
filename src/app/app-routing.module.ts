import { Injectable, NgModule } from '@angular/core';
import { RouterModule, RouterStateSnapshot, Routes, TitleStrategy } from '@angular/router';
import { MsalGuard, MsalRedirectComponent } from '@azure/msal-angular';
import { Title } from '@angular/platform-browser';

import { HomeComponent } from './home/home.component';
import { LogoutComponent } from './logout/logout.component';

@Injectable()
export class ImsTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    const pageTitle = title !== undefined ? `${title} | IMS` : 'Inventory Management System'
    this.title.setTitle(pageTitle);
  }
}

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: MsalRedirectComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'customers', canActivate: [MsalGuard], loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule) },
  { path: 'recycling', canActivate: [MsalGuard], loadChildren: () => import('./recycling/recycling.module').then(m => m.RecyclingModule) },
  { path: 'pallets', canActivate: [MsalGuard], loadChildren: () => import('./pallets/pallets.module').then(m => m.PalletsModule) },
  { path: 'runs', canActivate: [MsalGuard], loadChildren: () => import('./runs/runs.module').then(m => m.RunsModule) },
  { path: 'chemicals', canActivate: [MsalGuard], loadChildren: () => import('./chemicals/chemicals.module').then(m => m.ChemicalsModule) },
  { path: 'transfers', canActivate: [MsalGuard], loadChildren: () => import('./interstate-transfers/interstate-transfers.module').then(m => m.InterstateTransfersModule) },
  { path: 'loading-schedule', canActivate: [MsalGuard], loadChildren: () => import('./loading-schedule/loading-schedule.module').then(m => m.LoadingScheduleModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    paramsInheritanceStrategy: 'always'
})],
  exports: [RouterModule],
  providers: [
    {provide: TitleStrategy, useClass: ImsTitleStrategy}
  ]
})
export class AppRoutingModule { }
