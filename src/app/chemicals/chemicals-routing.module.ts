import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ChemicalListComponent } from './chemical-list/chemical-list.component';
import { ChemicalViewComponent } from './chemical-view/chemical-view.component';
import { ChemicalsComponent } from './chemicals.component';


const routes: Routes = [
  {
    path: '',
    component: ChemicalsComponent,
    children: [
      {
        path: '',
        data: {title: 'Chemicals'},
        component: ChemicalListComponent,
        children: [
          {
            path: ':id',
            data: {title: 'Chemicals'},
            component: ChemicalViewComponent,
          }
        ]
      }
    ]
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
export class ChemicalsRoutingModule { }