import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { LoadingScheduleComponent } from './loading-schedule.component';
import { LoadingScheduleRoutingModule } from './loading-schedule-routing.module';
import { LoadingScheduleService } from './shared/loading-schedule.service';
import { LoadingScheduleListComponent } from './loading-schedule-list/loading-schedule-list.component';
import { LoadingScheduleNewComponent } from './loading-schedule-new/loading-schedule-new.component';
import { LoadingScheduleViewComponent } from './loading-schedule-view/loading-schedule-view.component';
import { LoadingSchedulePanComponent } from './loading-schedule-pan/loading-schedule-pan.component';
import { PipeModule } from '../shared/pipes/pipe.module';
import { PanListModule } from '../pan-list/pan-list.module';

@NgModule({
  declarations: [
    LoadingScheduleComponent,
    LoadingScheduleListComponent,
    LoadingScheduleNewComponent,
    LoadingScheduleViewComponent,
    LoadingSchedulePanComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    PipeModule,
    LoadingScheduleRoutingModule,
    PanListModule
  ],
  providers: [
    LoadingScheduleService
  ]
})
export class LoadingScheduleModule { }
