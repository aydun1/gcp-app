import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { LoadingScheduleListComponent } from '../loading-schedule/loading-schedule-list/loading-schedule-list.component';
import { LoadingScheduleNewComponent } from '../loading-schedule/loading-schedule-new/loading-schedule-new.component';
import { LoadingScheduleViewComponent } from '../loading-schedule/loading-schedule-view/loading-schedule-view.component';
import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InterstateTransferListComponent } from './interstate-transfer-list/interstate-transfer-list.component';
import { PanListComponent } from '../pan-list/pan-list.component';
import { InterstateTransferSuggestedListComponent } from './interstate-transfer-suggested-list/interstate-transfer-suggested-list.component';
import { InterstateTransfersComponent } from './interstate-transfers.component';

const routes: Routes = [
  {
    path: '',
    component: InterstateTransfersComponent,
    canActivate: [MsalGuard],
  },
  {
    path: 'requested-items',
    component: InterstateTransferListComponent,
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
    component: InterstateTransferSuggestedListComponent,
    canActivate: [MsalGuard]
  },
  {
    path: 'pan-list',
    component: PanListComponent,
    canActivate: [MsalGuard]
  },
  {
    path: 'loading-schedule',
    component: LoadingScheduleListComponent,
    canActivate: [MsalGuard],
    children: [
      {
        path: 'new',
        data: {title: 'New entry'},
        component: LoadingScheduleNewComponent
      },
      {
        path: ':id',
        data: {title: 'View entry'},
        component: LoadingScheduleViewComponent
      },
    ]
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