import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SharedModule } from '../shared/shared.module';
import { InterstateTransfersComponent } from './interstate-transfers.component';
import { InterstateTransfersService } from './shared/interstate-transfers.service';
import { InterstateTransfersRoutingModule } from './interstate-transfers-routing.module';
import { InterstateTransferListComponent } from './interstate-transfer-list/interstate-transfer-list.component';
import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InterstateTransferSuggestedListComponent } from './interstate-transfer-suggested-list/interstate-transfer-suggested-list.component';
import { PipeModule } from '../shared/pipes/pipe.module';
import { PanListModule } from '../pan-list/pan-list.module';

@NgModule({
  declarations: [
    InterstateTransfersComponent,
    InterstateTransferListComponent,
    InterstateTransferViewComponent,
    InterstateTransferSuggestedListComponent
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
