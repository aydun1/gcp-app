import { Route } from '@angular/router';

import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InterstateTransferSuggestedComponent } from './interstate-transfer-suggested/interstate-transfer-suggested.component';
import { InterstateTransfersComponent } from './interstate-transfers.component';
import { InterstateTransferNewComponent } from './interstate-transfer-new/interstate-transfer-new.component';
import { InterstateTransfersActiveComponent } from './interstate-transfers-active/interstate-transfers-active.component';

export default [
  {
    path: '',
    component: InterstateTransfersComponent,
    title: 'Inventory Transfers'
  },
  {
    path: 'suggested-items',
    component: InterstateTransferSuggestedComponent,
    title: 'Suggested Items'
  },
  {
    path: 'new',
    component: InterstateTransferNewComponent,
    title: 'Quick Transfer'
  },
  {
    path: 'active',
    title: 'Requested Items',
    component: InterstateTransfersActiveComponent,
    children: [{
      path: ':ittId',
      component: InterstateTransferViewComponent
    }]
  },
] satisfies Route[];