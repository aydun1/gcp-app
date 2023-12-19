import { Route } from '@angular/router';

import { RecyclingListComponent } from './recycling-list/recycling-list.component';
import { RecyclingNewComponent } from './recycling-new/recycling-new.component';
import { RecyclingReceiptListComponent } from './recycling-receipt-list/recycling-receipt-list.component';
import { RecyclingReceiptNewComponent } from './recycling-receipt-new/recycling-receipt-new.component';
import { RecyclingViewComponent } from './recycling-view/recycling-view.component';
import { RecyclingComponent } from './recycling.component';

export default [
  {
    path: '',
    title: 'Recycling',
    component: RecyclingComponent,
  },
  {
    path: 'cages',
    title: 'Recycling Cages',
    component: RecyclingListComponent,
    children: [
      {
        title: 'New Recycling Cage',
        path: 'new',
        component: RecyclingNewComponent
      },
      {
        path: ':id',
        title: 'Recycling Cages',
        component: RecyclingViewComponent
      }
    ]
  },
  {
    path: 'receipts',
    title: 'Polymer Receipts',
    component: RecyclingReceiptListComponent,
    children: [{
      path: 'new',
      title: 'New Polymer Receipt',
      component: RecyclingReceiptNewComponent
    }]
  }
] satisfies Route[];