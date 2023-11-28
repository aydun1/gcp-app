import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoadingScheduleComponent } from './loading-schedule.component';
import { LoadingScheduleListComponent } from './loading-schedule-list/loading-schedule-list.component';
import { LoadingScheduleNewComponent } from './loading-schedule-new/loading-schedule-new.component';
import { LoadingScheduleViewComponent } from './loading-schedule-view/loading-schedule-view.component';
import { LoadingSchedulePanComponent } from './loading-schedule-pan/loading-schedule-pan.component';

const routes: Routes = [
  {
    path: '',
    component: LoadingScheduleComponent,
    children: [
      {
        path: '',
        title: 'Loading Schedule',
        component: LoadingScheduleListComponent,
        children: [
          {
            path: 'new',
            title: 'New entry',
            component: LoadingScheduleNewComponent
          },
          {
            path: ':id',
            title: 'View entry',
            component: LoadingScheduleViewComponent,
            children: [
              {
                path: 'edit',
                title: 'Edit entry',
                component: LoadingScheduleNewComponent,
              },
              {
                path: 'panlist',
                title: 'Edit pan list',
                component: LoadingSchedulePanComponent,
              }
            ]
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
export class LoadingScheduleRoutingModule { }