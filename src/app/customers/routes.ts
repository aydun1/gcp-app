import { Route } from '@angular/router';

import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerViewComponent } from './customer-view/customer-view.component';

export default [
  {
    path: '',
    children: [{
      path: '',
      title: 'Customers',
      component: CustomerListComponent,
      children: [
        {
          path: ':id',
          component: CustomerViewComponent
        }
    ]
    }]
  }
] satisfies Route[];