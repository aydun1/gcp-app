import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { PalletsComponent } from './pallets.component';
import { PalletListComponent } from './pallet-list/pallet-list.component';
import { PalletReconciliationComponent } from './pallet-reconciliation/pallet-reconciliation.component';


const routes: Routes = [
  {
    path: '',
    component: PalletsComponent,
    children: [{
      path: '',
      component: PalletListComponent
    },
    {
      path: 'stocktake',
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