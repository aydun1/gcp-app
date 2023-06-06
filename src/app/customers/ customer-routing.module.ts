import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CustomersComponent } from './customers.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerViewComponent } from './customer-view/customer-view.component';

const routes: Routes = [
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
]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class CustomerRoutingModule { }