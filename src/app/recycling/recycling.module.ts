import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { RecyclingService } from './shared/recycling.service';
import { RecyclingRoutingModule } from './ recycling-routing.module';
import { RecyclingComponent } from './recycling.component';
import { RecyclingDialogComponent } from './shared/recycling-dialog/recycling-dialog.component';
import { RecyclingListComponent } from './recycling-list/recycling-list.component';
import { RecyclingViewComponent } from './recycling-view/recycling-view.component';
import { RecyclingNewComponent } from './recycling-new/recycling-new.component';
import { ActionButtonComponent } from './shared/action-button/action-button.component';
import { CageDetailsComponent } from './shared/cage-details/cage-details.component';
import { CageWeightsComponent } from './shared/cage-weights/cage-weights.component';

@NgModule({
  declarations: [
    RecyclingComponent,
    RecyclingDialogComponent,
    RecyclingListComponent,
    RecyclingViewComponent,
    RecyclingNewComponent,
    ActionButtonComponent,
    CageDetailsComponent,
    CageWeightsComponent,
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
