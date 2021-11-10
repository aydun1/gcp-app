import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { PalletsRoutingModule } from './pallets-routing.module';
import { PalletsComponent } from './pallets.component';
import { PalletDialogComponent } from './shared/pallet-dialog/pallet-dialog.component';
import { PalletsService } from './shared/pallets.service';



@NgModule({
  declarations: [
    PalletsComponent,
    PalletDialogComponent,
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
