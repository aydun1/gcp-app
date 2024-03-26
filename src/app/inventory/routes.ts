import { Route } from '@angular/router';

import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InventorySuggestedComponent } from './inventory-suggested/inventory-suggested.component';
import { InventoryComponent } from './inventory.component';
import { InterstateTransferNewComponent } from './inventory-transfer-new/interstate-transfer-new.component';
import { InventoryRequestedComponent } from './inventory-requested/inventory-requested.component';
import { InventoryRequiredComponent } from './inventory-required/inventory-required.component';

export default [
  {
    path: '',
    component: InventoryComponent,
    title: 'Inventory'
  },
  {
    path: 'suggested',
    component: InventorySuggestedComponent,
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
    component: InventoryRequestedComponent,
    children: [{
      path: ':ittId',
      component: InterstateTransferViewComponent
    }]
  },
  {
    path: 'required',
    component: InventoryRequiredComponent,
    title: 'Production Required'
  },
] satisfies Route[];