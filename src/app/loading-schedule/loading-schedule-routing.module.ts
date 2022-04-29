import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { LoadingScheduleComponent } from './loading-schedule.component';
import { LoadingScheduleListComponent } from './loading-schedule-list/loading-schedule-list.component';

const routes: Routes = [
  {
    path: '',
    component: LoadingScheduleComponent,
    children: [
      {
        path: '',
        data: {title: 'Loading Schedule'},
        component: LoadingScheduleListComponent
      }
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