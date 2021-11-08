import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { RecyclingService } from './shared/recycling.service';
import { RecyclingRoutingModule } from './ recycling-routing.module';
import { RecyclingComponent } from './recycling.component';



@NgModule({
  declarations: [
    RecyclingComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RecyclingRoutingModule
  ],
  providers: [
    RecyclingService
  ]
})
export class RecyclingModule { }
