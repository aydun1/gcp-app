import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SdsListComponent } from './sds-list/sds-list.component';
import { SdsViewComponent } from './sds-view/sds-view.component';
import { SdsComponent } from './sds.component';


const routes: Routes = [
  {
    path: '',
    component: SdsComponent,
    children: [
      {
        path: '',
        data: {title: 'Chemicals'},
        component: SdsListComponent,
        children: [
          {
            path: ':id',
            data: {title: 'Chemicals'},
            component: SdsViewComponent,
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
export class SdsRoutingModule { }