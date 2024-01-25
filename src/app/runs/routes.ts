import { Route } from '@angular/router';

import { RunListComponent } from './run-list/run-list.component';
import { RunListCompletedComponent } from './run-list-completed/run-list-completed.component';


export default [
  {
    path: '',
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