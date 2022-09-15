import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { InterstateTransfersComponent } from './interstate-transfers.component';
import { InterstateTransfersService } from './shared/interstate-transfers.service';
import { InterstateTransfersRoutingModule } from './interstate-transfers-routing.module';
import { InterstateTransferListComponent } from './interstate-transfer-list/interstate-transfer-list.component';
import { InterstateTransferViewComponent } from './interstate-transfer-view/interstate-transfer-view.component';
import { PipeModule } from '../shared/pipes/pipe.module';

@NgModule({
  declarations: [
    InterstateTransfersComponent,
    InterstateTransferListComponent,
    InterstateTransferViewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    PipeModule,
    InterstateTransfersRoutingModule
  ],
  providers: [
    InterstateTransfersService
  ]
})
export class InterstateTransfersModule { }
