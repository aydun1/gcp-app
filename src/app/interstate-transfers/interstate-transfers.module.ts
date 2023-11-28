import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SharedModule } from '../shared/shared.module';
import { InterstateTransfersComponent } from './interstate-transfers.component';
import { InterstateTransfersService } from './shared/interstate-transfers.service';
import { InterstateTransfersRoutingModule } from './interstate-transfers-routing.module';
import { InterstateTransferNewComponent } from './interstate-transfer-new/interstate-transfer-new.component';
import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InterstateTransferSuggestedComponent } from './interstate-transfer-suggested/interstate-transfer-suggested.component';
import { PipeModule } from '../shared/pipes/pipe.module';
import { PanListModule } from '../pan-list/pan-list.module';
import { TransactionHistoryDialogComponent } from './transaction-history-dialog/transaction-history-dialog.component';
import { InterstateTransfersActiveComponent } from './interstate-transfers-active/interstate-transfers-active.component';

@NgModule({
  declarations: [
    InterstateTransfersComponent,
    InterstateTransferNewComponent,
    InterstateTransferSuggestedComponent,
    InterstateTransferViewComponent,
    InterstateTransfersActiveComponent,
    TransactionHistoryDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatProgressSpinnerModule,
    PipeModule,
    InterstateTransfersRoutingModule,
    PanListModule
  ],
  providers: [
    InterstateTransfersService
  ]
})
export class InterstateTransfersModule { }
