import { Route } from '@angular/router';

import { PalletsComponent } from './pallets.component';
import { PalletListComponent } from './pallet-list/pallet-list.component';
import { PalletInterstateTransferNewComponent } from './pallet-interstate-transfer/pallet-interstate-transfer-new/pallet-interstate-transfer-new.component';
import { PalletInterstateTransferListComponent } from './pallet-interstate-transfer/pallet-interstate-transfer-list/pallet-interstate-transfer-list.component';
import { PalletInterstateTransferViewComponent } from './pallet-interstate-transfer/pallet-interstate-transfer-view/pallet-interstate-transfer-view.component';
import { PalletReconciliationListComponent } from './pallet-reconciliation/pallet-reconciliation-list/pallet-reconciliation-list.component';
import { PalletReconciliationNewComponent } from './pallet-reconciliation/pallet-reconciliation-new/pallet-reconciliation-new.component';
import { PalletReconciliationViewComponent } from './pallet-reconciliation/pallet-reconciliation-view/pallet-reconciliation-view.component';


export default [
  {
    path: '',
    title: 'Pallets',
    component: PalletsComponent,
  },
  {
    path: 'history',
    title: 'Pallet Transfer History',
    component: PalletListComponent
  },
  {
    path: 'stocktake',
    title: 'Pallet stocktake',
    component: PalletReconciliationListComponent,
    children: [
      {
        path: 'new',
        title: 'New Pallet Stocktake',
        component: PalletReconciliationNewComponent
      },
      {
        path: ':id',
        title: 'Pallet Stocktake',
        component: PalletReconciliationViewComponent,
        children: [
          {
            path: 'edit',
            title: 'Edit Entry',
            component: PalletReconciliationNewComponent,
          }
        ]
      }
    ]
  },
  {
    path: 'transfer',
    title: 'Interstate Pallet Transfers',
    component: PalletInterstateTransferListComponent,
    children: [
      {
        title: 'New Interstate Pallet Transfer',
        path: 'new',
        component: PalletInterstateTransferNewComponent
      },
      {
        path: ':id',
        title: 'Interstate Pallet Transfers',
        component: PalletInterstateTransferViewComponent
      }
    ]
  }
] satisfies Route[];