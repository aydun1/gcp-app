import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomersComponent } from './customers.component';

const routes: Routes = [
  {
    path: '',
    component: CustomersComponent,
    //runGuardsAndResolvers: 'always',
    canActivate: [MsalGuard],
    children: [{
      path: '',
      component: CustomerListComponent,
      children: [
        {
          path: ':id',
          component: CustomerListComponent
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