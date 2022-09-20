import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { InterstateTransfersComponent } from './interstate-transfers.component';
import { InterstateTransfersService } from './shared/interstate-transfers.service';
import { InterstateTransfersRoutingModule } from './interstate-transfers-routing.module';
import { InterstateTransferListComponent } from './interstate-transfer-list/interstate-transfer-list.component';
import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { PipeModule } from '../shared/pipes/pipe.module';
import { InterstateTransferPanListComponent } from './interstate-transfer-pan-list/interstate-transfer-pan-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    InterstateTransfersComponent,
    InterstateTransferListComponent,
    InterstateTransferViewComponent,
    InterstateTransferPanListComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatProgressSpinnerModule,
    PipeModule,
    InterstateTransfersRoutingModule
  ],
  providers: [
    InterstateTransfersService
  ]
})
export class InterstateTransfersModule { }
