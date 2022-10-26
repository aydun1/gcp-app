import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

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
    canActivate: [MsalGuard],
  },
  {
    path: 'requested-items',
    component: InterstateTransferRequestedComponent,
    canActivate: [MsalGuard],
    children: [
      {
        path: ':id',
        component: InterstateTransferViewComponent,
        canActivate: [MsalGuard],
      }
    ]
  },
  {
    path: 'suggested-items',
    component: InterstateTransferSuggestedComponent,
    canActivate: [MsalGuard]
  },
  {
    path: 'new',
    component: InterstateTransferNewComponent,
    canActivate: [MsalGuard]
  },
  {
    path: 'active',
    component: InterstateTransfersActiveComponent,
    canActivate: [MsalGuard]
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