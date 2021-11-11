import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { PalletReconciliationComponent } from './pallet-reconciliation/pallet-reconciliation.component';

import { PalletsComponent } from './pallets.component';

const routes: Routes = [
  {
    path: '',
    component: PalletsComponent,
    canActivate: [MsalGuard],
    children: [{
      path: '',
      component: PalletReconciliationComponent
    }]
  }
]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class PalletsRoutingModule { }