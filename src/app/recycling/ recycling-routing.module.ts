import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { RecyclingComponent } from './recycling.component';


const routes: Routes = [
  {
    path: '',
    component: RecyclingComponent,
    canActivate: [MsalGuard],
    children: []
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
export class RecyclingRoutingModule { }