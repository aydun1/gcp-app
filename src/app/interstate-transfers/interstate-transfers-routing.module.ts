import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InterstateTransferRequestedComponent } from './interstate-transfer-requested/interstate-transfer-requested.component';
import { InterstateTransferSuggestedComponent } from './interstate-transfer-suggested/interstate-transfer-suggested.component';
import { InterstateTransfersComponent } from './interstate-transfers.component';
import { InterstateTransferNewComponent } from './interstate-transfer-new/interstate-transfer-new.component';
import { InterstateTransfersActiveComponent } from './interstate-transfers-active/interstate-transfers-active.component';

const routes: Routes = [
  {
    path: '',
    component: InterstateTransfersComponent,
    title: 'Inventory Transfers'
  },
  {
    path: 'requested-items',
    component: InterstateTransferRequestedComponent,
    title: 'Requested Items (PO)',
    children: [
      {
        path: ':id',
        component: InterstateTransferViewComponent
      }
    ]
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
    title: 'Requested Items (ITT)',
    component: InterstateTransfersActiveComponent,
    children: [{
      path: ':ittId',
      component: InterstateTransferViewComponent
    }]
  },
]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class InterstateTransfersRoutingModule { }