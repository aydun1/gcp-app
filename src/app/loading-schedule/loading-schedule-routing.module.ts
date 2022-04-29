import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { LoadingScheduleComponent } from './loading-schedule.component';

const routes: Routes = [
  {
    path: '',
    component: LoadingScheduleComponent,
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