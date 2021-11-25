import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { PalletsRoutingModule } from './pallets-routing.module';
import { PalletsComponent } from './pallets.component';
import { PalletDialogComponent } from './shared/pallet-dialog/pallet-dialog.component';
import { PalletsService } from './shared/pallets.service';
import { PalletReconciliationNewComponent } from './pallet-reconciliation-new/pallet-reconciliation-new.component';
import { PalletListComponent } from './pallet-list/pallet-list.component';
import { PalletInterstateTransferNewComponent } from './pallet-interstate-transfer-new/pallet-interstate-transfer-new.component';
import { PalletInterstateTransferListComponent } from './pallet-interstate-transfer-list/pallet-interstate-transfer-list.component';
import { PalletViewComponent } from './pallet-view/pallet-view.component';
import { PalletTransferViewComponent } from './pallet-transfer-view/pallet-transfer-view.component';
import { PalletReconciliationListComponent } from './pallet-reconciliation-list/pallet-reconciliation-list.component';



@NgModule({
  declarations: [
    PalletsComponent,
    PalletDialogComponent,
    PalletReconciliationListComponent,
    PalletReconciliationNewComponent,
    PalletListComponent,
    PalletInterstateTransferNewComponent,
    PalletInterstateTransferListComponent,
    PalletViewComponent,
    PalletTransferViewComponent,
    PalletReconciliationListComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    PalletsRoutingModule
  ],
  providers: [
    PalletsService
  ]
})
export class PalletsModule { }
