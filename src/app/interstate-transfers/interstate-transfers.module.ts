import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SharedModule } from '../shared/shared.module';
import { InterstateTransfersComponent } from './interstate-transfers.component';
import { InterstateTransfersService } from './shared/interstate-transfers.service';
import { InterstateTransfersRoutingModule } from './interstate-transfers-routing.module';
import { InterstateTransferRequestedComponent } from './interstate-transfer-requested/interstate-transfer-requested.component';
import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { InterstateTransferSuggestedComponent } from './interstate-transfer-suggested/interstate-transfer-suggested.component';
import { PipeModule } from '../shared/pipes/pipe.module';
import { PanListModule } from '../pan-list/pan-list.module';

@NgModule({
  declarations: [
    InterstateTransfersComponent,
    InterstateTransferRequestedComponent,
    InterstateTransferSuggestedComponent,
    InterstateTransferViewComponent
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
