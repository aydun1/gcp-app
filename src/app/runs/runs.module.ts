import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SharedModule } from '../shared/shared.module';
import { RunsRoutingModule } from './runs-routing.module';
import { RunListComponent } from './run-list/run-list.component';
import { RunsComponent } from './runs.component';
import { DeliveryEditorDialogComponent } from './shared/delivery-editor-dialog/delivery-editor-dialog.component';
import { RunPickerDialogComponent } from './shared/run-picker-dialog/run-picker-dialog.component';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { RunManagerDialogComponent } from './shared/run-manager-dialog/run-manager-dialog.component';

@NgModule({
  declarations: [
    RunsComponent,
    RunListComponent,
    DeliveryEditorDialogComponent,
    RunManagerDialogComponent,
    RunPickerDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DragDropModule,
    RunsRoutingModule,
    MatProgressSpinnerModule
  ],
  providers: [
  ]
})
export class RunsModule { }
