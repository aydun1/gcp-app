import { Route } from '@angular/router';

import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InterstateTransferSuggestedComponent } from './inventory-suggested/inventory-suggested.component';
import { InventoryComponent } from './inventory.component';
import { InterstateTransferNewComponent } from './inventory-transfer-new/interstate-transfer-new.component';
import { InterstateTransfersActiveComponent } from './interstate-transfers-active/interstate-transfers-active.component';

export default [
  {
    path: '',
    component: InventoryComponent,
    title: 'Inventory'
  },
  {
    path: 'suggested',
    component: InterstateTransferSuggestedComponent,
    title: 'Suggested Items'
  },
  {
    path: 'new',
    component: InterstateTransferNewComponent,
    title: 'Quick Transfer'
  },
  {
    path: 'requested',
    title: 'Requested Items',
    component: InterstateTransfersActiveComponent,
    children: [{
      path: ':ittId',
      component: InterstateTransferViewComponent
    }]
  },
] satisfies Route[];