import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { RecyclingRoutingModule } from './recycling-routing.module';
import { RecyclingService } from './shared/recycling.service';
import { RecyclingReceiptsService } from './shared/recycling-receipts.service';
import { RecyclingComponent } from './recycling.component';
import { RecyclingDialogComponent } from './shared/recycling-dialog/recycling-dialog.component';
import { RecyclingDocketDialogComponent } from './shared/recycling-docket-dialog/recycling-docket-dialog.component';
import { RecyclingListComponent } from './recycling-list/recycling-list.component';
import { RecyclingViewComponent } from './recycling-view/recycling-view.component';
import { RecyclingNewComponent } from './recycling-new/recycling-new.component';
import { ActionButtonComponent } from './shared/action-button/action-button.component';
import { CageDetailsComponent } from './shared/cage-details/cage-details.component';
import { CageEditDialogComponent } from './shared/cage-edit-dialog/cage-edit-dialog.component';
import { CageNotesComponent } from './shared/cage-notes/cage-notes.component';
import { CageMaterialComponent } from './shared/cage-material/cage-material.component';
import { CageWeightsComponent } from './shared/cage-weights/cage-weights.component';
import { RecyclingCustomerListDialogComponent } from './shared/recycling-customer-list-dialog/recycling-customer-list-dialog.component';
import { RecyclingReceiptListComponent } from './recycling-receipt-list/recycling-receipt-list.component';
import { RecyclingReceiptNewComponent } from './recycling-receipt-new/recycling-receipt-new.component';
import { SignaturePadModule } from '../shared/signature/signature-pad.module';

@NgModule({
  declarations: [
    RecyclingComponent,
    RecyclingDialogComponent,
    RecyclingDocketDialogComponent,
    RecyclingListComponent,
    RecyclingViewComponent,
    RecyclingNewComponent,
    ActionButtonComponent,
    CageDetailsComponent,
    CageEditDialogComponent,
    CageNotesComponent,
    CageMaterialComponent,
    CageWeightsComponent,
    RecyclingCustomerListDialogComponent,
    RecyclingReceiptListComponent,
    RecyclingReceiptNewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SignaturePadModule,
    RecyclingRoutingModule
  ],
  providers: [
    RecyclingService,
    RecyclingReceiptsService
  ]
})
export class RecyclingModule { }
