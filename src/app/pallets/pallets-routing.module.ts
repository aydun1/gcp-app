import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { PalletsComponent } from './pallets.component';
import { PalletListComponent } from './pallet-list/pallet-list.component';
import { PalletReconciliationComponent } from './pallet-reconciliation/pallet-reconciliation.component';
import { PalletInterstateTransferNewComponent } from './pallet-interstate-transfer-new/pallet-interstate-transfer-new.component';
import { PalletInterstateTransferListComponent } from './pallet-interstate-transfer-list/pallet-interstate-transfer-list.component';


const routes: Routes = [
  {
    path: '',
    component: PalletsComponent,
    children: [
      {
        path: '',
        component: PalletListComponent
      },
      {
        path: 'stocktake',
        component: PalletReconciliationComponent
      },
      {
        path: 'transfer',
        component: PalletInterstateTransferListComponent,
        children: [
          {
            path: 'new',
            component: PalletInterstateTransferNewComponent
          }

        ]
      }
    ]
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