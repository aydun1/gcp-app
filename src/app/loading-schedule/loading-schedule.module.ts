import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { LoadingScheduleComponent } from './loading-schedule.component';
import { LoadingScheduleRoutingModule } from './loading-schedule-routing.module';
import { LoadingScheduleService } from './shared/loading-schedule.service';



@NgModule({
  declarations: [
    LoadingScheduleComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    LoadingScheduleRoutingModule
  ],
  providers: [
    LoadingScheduleService
  ]
})
export class LoadingScheduleModule { }
