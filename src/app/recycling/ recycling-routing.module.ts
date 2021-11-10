import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { RecyclingListComponent } from './recycling-list/recycling-list.component';
import { RecyclingNewComponent } from './recycling-new/recycling-new.component';
import { RecyclingViewComponent } from './recycling-view/recycling-view.component';

import { RecyclingComponent } from './recycling.component';


const routes: Routes = [
  {
    path: '',
    component: RecyclingComponent,
    canActivate: [MsalGuard],
    children: [{
      path: '',
      component: RecyclingListComponent,
      children: [
        {
          path: 'new',
          component: RecyclingNewComponent
        },
        {
          path: ':id',
          component: RecyclingViewComponent
        }
      ]
    }]
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
export class RecyclingRoutingModule { }