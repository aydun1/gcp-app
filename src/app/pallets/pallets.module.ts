import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
import { PalletInterstateTransferViewComponent } from './pallet-interstate-transfer-view/pallet-interstate-transfer-view.component';
import { PalletReconciliationListComponent } from './pallet-reconciliation-list/pallet-reconciliation-list.component';
import { PalletReconciliationViewComponent } from './pallet-reconciliation-view/pallet-reconciliation-view.component';
import { PalletDocketDialogComponent } from './shared/pallet-docket-dialog/pallet-docket-dialog.component';
import { PalletCustomerListDialogComponent } from './shared/pallet-customer-list-dialog/pallet-customer-list-dialog.component';

@NgModule({
  declarations: [
    PalletsComponent,
    PalletDialogComponent,
    PalletReconciliationListComponent,
    PalletReconciliationNewComponent,
    PalletListComponent,
    PalletCustomerListDialogComponent,
    PalletInterstateTransferNewComponent,
    PalletInterstateTransferListComponent,
    PalletInterstateTransferViewComponent,
    PalletViewComponent,
    PalletReconciliationListComponent,
    PalletReconciliationViewComponent,
    PalletDocketDialogComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    PalletsRoutingModule,
    MatProgressSpinnerModule,

  ],
  providers: [
    PalletsService
  ]
})
export class PalletsModule { }
