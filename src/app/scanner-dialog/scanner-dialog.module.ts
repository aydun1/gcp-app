import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { SharedModule } from '../shared/shared.module';
import { ScannerDialogComponent } from './scanner-dialog.component';


@NgModule({
  declarations: [
    ScannerDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ZXingScannerModule
  ],
  providers: [
  ]
})
export class ScannerDialogModule { }
