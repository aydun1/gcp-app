import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SdsListComponent } from './sds-list/sds-list.component';
import { SdsComponent } from './sds.component';


const routes: Routes = [
  {
    path: '',
    component: SdsComponent,
    children: [
      {
        path: '',
        data: {title: 'Chemical list'},
        component: SdsListComponent
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
export class SdsRoutingModule { }