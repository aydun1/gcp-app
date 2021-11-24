import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecyclingListComponent } from './recycling-list/recycling-list.component';
import { RecyclingNewComponent } from './recycling-new/recycling-new.component';
import { RecyclingReceiptListComponent } from './recycling-receipt-list/recycling-receipt-list.component';
import { RecyclingViewComponent } from './recycling-view/recycling-view.component';

import { RecyclingComponent } from './recycling.component';


const routes: Routes = [
  {
    path: '',
    component: RecyclingComponent,
  },
  {
    path: 'cages',
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
  },
  {
    path: 'receipts',
    component: RecyclingReceiptListComponent
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