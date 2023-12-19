import { Route } from '@angular/router';

import { CustomersComponent } from './customers.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerViewComponent } from './customer-view/customer-view.component';

export default [
  {
    path: '',
    component: CustomersComponent,
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