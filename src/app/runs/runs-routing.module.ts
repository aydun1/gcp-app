import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RunListComponent } from './run-list/run-list.component';

import { RunsComponent } from './runs.component';


const routes: Routes = [
  {
    path: '',
    component: RunsComponent,
    children: [
      {
        path: '',
        title: 'Runs',
        component: RunListComponent
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
export class RunsRoutingModule { }