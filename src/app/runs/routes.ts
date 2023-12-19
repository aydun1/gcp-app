import { Route } from '@angular/router';

import { RunsComponent } from './runs.component';
import { RunListComponent } from './run-list/run-list.component';
import { RunListCompletedComponent } from './run-list-completed/run-list-completed.component';
import { GroupByCustomerAddressPipe } from '../shared/pipes/group-by-customer-address';
import { DeliveryService } from './shared/delivery.service';


export default [
  {
    path: '',
    component: RunsComponent,
    children: [
      {
        path: '',
        title: 'Runs',
        providers: [GroupByCustomerAddressPipe, DeliveryService],
        component: RunListComponent
      },
      {
        path: 'delivered',
        title: 'Delivered',
        component: RunListCompletedComponent 
      }
    ]
  }
] satisfies Route[];