import { Route } from '@angular/router';

import { RunsComponent } from './runs.component';
import { RunListComponent } from './run-list/run-list.component';
import { RunListCompletedComponent } from './run-list-completed/run-list-completed.component';


export default [
  {
    path: '',
    component: RunsComponent,
    children: [
      {
        path: '',
        title: 'Runs',
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