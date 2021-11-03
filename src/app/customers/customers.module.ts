import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomersComponent } from './customers.component';
import { CustomersService } from './shared/customers.service';
import { SharedModule } from '../shared/shared.module';
import { CustomerRoutingModule } from './ customer-routing.module';
import { CustomerViewComponent } from './customer-view/customer-view.component';



@NgModule({
  declarations: [
    CustomersComponent,
    CustomerListComponent,
    CustomerViewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CustomerRoutingModule
  ],
  providers: [
    CustomersService
  ]
})
export class CustomersModule { }
