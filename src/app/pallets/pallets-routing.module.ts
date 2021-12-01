import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { PalletsComponent } from './pallets.component';
import { PalletListComponent } from './pallet-list/pallet-list.component';
import { PalletReconciliationListComponent } from './pallet-reconciliation-list/pallet-reconciliation-list.component';
import { PalletInterstateTransferNewComponent } from './pallet-interstate-transfer-new/pallet-interstate-transfer-new.component';
import { PalletInterstateTransferListComponent } from './pallet-interstate-transfer-list/pallet-interstate-transfer-list.component';
import { PalletInterstateTransferViewComponent } from './pallet-interstate-transfer-view/pallet-interstate-transfer-view.component';
import { PalletReconciliationNewComponent } from './pallet-reconciliation-new/pallet-reconciliation-new.component';
import { PalletDocketViewComponent } from './pallet-docket-view/pallet-docket-view.component';


const routes: Routes = [
  {
    path: '',
    component: PalletsComponent,
  },
  {
    path: 'history',
    component: PalletListComponent,
    children: [{
      path: ':id',
      component: PalletDocketViewComponent
    }]
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
      component: PalletInterstateTransferViewComponent
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