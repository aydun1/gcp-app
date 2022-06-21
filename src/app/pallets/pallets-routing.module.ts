import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PalletsComponent } from './pallets.component';
import { PalletListComponent } from './pallet-list/pallet-list.component';
import { PalletReconciliationListComponent } from './pallet-reconciliation-list/pallet-reconciliation-list.component';
import { PalletInterstateTransferNewComponent } from './pallet-interstate-transfer-new/pallet-interstate-transfer-new.component';
import { PalletInterstateTransferListComponent } from './pallet-interstate-transfer-list/pallet-interstate-transfer-list.component';
import { PalletInterstateTransferViewComponent } from './pallet-interstate-transfer-view/pallet-interstate-transfer-view.component';
import { PalletReconciliationNewComponent } from './pallet-reconciliation-new/pallet-reconciliation-new.component';
import { PalletReconciliationViewComponent } from './pallet-reconciliation-view/pallet-reconciliation-view.component';


const routes: Routes = [
  {
    path: '',
    data: {title: 'Pallets'},
    component: PalletsComponent,
  },
  {
    path: 'history',
    data: {title: 'Pallet Transfer History'},
    component: PalletListComponent
  },
  {
    path: 'stocktake',
    data: {title: 'Pallet stocktake'},
    component: PalletReconciliationListComponent,
    children: [{
      path: 'new',
      data: {title: 'New Pallet stocktake'},
      component: PalletReconciliationNewComponent
    }, {
      path: ':id',
      data: {title: 'Pallet stocktake'},
      component: PalletReconciliationViewComponent
    }]
  },
  {
    path: 'transfer',
    data: {title: 'Interstate Pallet Transfers'},
    component: PalletInterstateTransferListComponent,
    children: [{
      data: {title: 'New Interstate Pallet Transfer'},
      path: 'new',
      component: PalletInterstateTransferNewComponent
    }, {
      path: ':id',
      data: {title: 'Interstate Pallet Transfers'},
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