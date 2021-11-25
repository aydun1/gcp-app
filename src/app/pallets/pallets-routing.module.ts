import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { PalletsComponent } from './pallets.component';
import { PalletListComponent } from './pallet-list/pallet-list.component';
import { PalletReconciliationListComponent } from './pallet-reconciliation-list/pallet-reconciliation-list.component';
import { PalletInterstateTransferNewComponent } from './pallet-interstate-transfer-new/pallet-interstate-transfer-new.component';
import { PalletInterstateTransferListComponent } from './pallet-interstate-transfer-list/pallet-interstate-transfer-list.component';
import { PalletTransferViewComponent } from './pallet-transfer-view/pallet-transfer-view.component';
import { PalletReconciliationNewComponent } from './pallet-reconciliation-new/pallet-reconciliation-new.component';


const routes: Routes = [
  {
    path: '',
    component: PalletsComponent,
  },
  {
    path: 'history',
    component: PalletListComponent
  },
  {
    path: 'stocktake',
    component: PalletReconciliationListComponent,
    children: [{
      path: 'new',
      component: PalletReconciliationNewComponent
    }]
  },
  {
    path: 'transfer',
    component: PalletInterstateTransferListComponent,
    children: [{
      path: 'new',
      component: PalletInterstateTransferNewComponent
    }, {
      path: ':id',
      component: PalletTransferViewComponent
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