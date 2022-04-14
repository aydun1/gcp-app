import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecyclingListComponent } from './recycling-list/recycling-list.component';
import { RecyclingNewComponent } from './recycling-new/recycling-new.component';
import { RecyclingReceiptListComponent } from './recycling-receipt-list/recycling-receipt-list.component';
import { RecyclingReceiptNewComponent } from './recycling-receipt-new/recycling-receipt-new.component';
import { RecyclingViewComponent } from './recycling-view/recycling-view.component';

import { RecyclingComponent } from './recycling.component';


const routes: Routes = [
  {
    path: '',
    data: {title: 'Recycling'},
    component: RecyclingComponent,
  },
  {
    path: 'cages',
    data: {title: 'Recycling Cages'},
    component: RecyclingListComponent,
    children: [
      {
        data: {title: 'New Recycling Cage'},
        path: 'new',
        component: RecyclingNewComponent
      },
      {
        path: ':id',
        data: {title: 'Recycling Cages'},
        component: RecyclingViewComponent
      }
    ]
  },
  {
    path: 'receipts',
    data: {title: 'Polymer Receipts'},
    component: RecyclingReceiptListComponent,
    children: [{
      path: 'new',
      data: {title: 'New Polymer Receipt'},
      component: RecyclingReceiptNewComponent
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