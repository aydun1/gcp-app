import { Route } from '@angular/router';

import { ChemicalListComponent } from './chemical-list/chemical-list.component';
import { ChemicalViewComponent } from './chemical-view/chemical-view.component';


export default [
  {
    path: '',
    children: [
      {
        path: '',
        title: 'Chemicals',
        component: ChemicalListComponent,
        children: [
          {
            path: ':id',
            component: ChemicalViewComponent,
          }
        ]
      }
    ]
  }
] satisfies Route[];