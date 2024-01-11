import { Route } from '@angular/router';

import { ChemicalListComponent } from './chemical-list/chemical-list.component';
import { ChemicalViewComponent } from './chemical-view/chemical-view.component';
import { ChemicalsComponent } from './chemicals.component';


export default [
  {
    path: '',
    component: ChemicalsComponent,
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