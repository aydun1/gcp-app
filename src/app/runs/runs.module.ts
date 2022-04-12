import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SharedModule } from '../shared/shared.module';
import { RunsRoutingModule } from './runs-routing.module';
import { RunListComponent } from './run-list/run-list.component';
import { RunsComponent } from './runs.component';

@NgModule({
  declarations: [
    RunsComponent,
    RunListComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DragDropModule,
    RunsRoutingModule
  ],
  providers: [
  ]
})
export class RunsModule { }
