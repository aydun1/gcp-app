import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RunsComponent } from './runs.component';
import { RunListComponent } from './run-list/run-list.component';
import { RunListCompletedComponent } from './run-list-completed/run-list-completed.component';


const routes: Routes = [
  {
    path: '',
    component: RunsComponent,
    children: [
      {
        path: '',
        title: 'Runs',
        component: RunListComponent
      },
      {
        path: 'delivered',
        title: 'Delivered',
        component: RunListCompletedComponent 
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