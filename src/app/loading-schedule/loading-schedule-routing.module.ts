import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { LoadingScheduleComponent } from './loading-schedule.component';
import { LoadingScheduleListComponent } from './loading-schedule-list/loading-schedule-list.component';
import { LoadingScheduleNewComponent } from './loading-schedule-new/loading-schedule-new.component';
import { LoadingScheduleViewComponent } from './loading-schedule-view/loading-schedule-view.component';
import { PanListComponent } from '../pan-list/pan-list.component';

const routes: Routes = [
  {
    path: '',
    component: LoadingScheduleComponent,
    children: [
      {
        path: '',
        data: {title: 'Loading Schedule'},
        component: LoadingScheduleListComponent
      },
      {
        path: 'new',
        data: {title: 'New entry'},
        component: LoadingScheduleNewComponent
      },
      {
        path: ':id',
        data: {title: 'View entry'},
        component: LoadingScheduleViewComponent,
        children: [
          {
            path: 'edit',
            component: LoadingScheduleNewComponent,
          },
          {
            path: 'panlist',
            component: PanListComponent,
          }
        ]
      },
    ],
    canActivate: [MsalGuard]
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
export class LoadingScheduleRoutingModule { }