import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { SdsComponent } from './sds.component';
import { SdsListComponent } from './sds-list/sds-list.component';

@NgModule({
  declarations: [
    SdsComponent,
    SdsListComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  providers: [
  ]
})
export class SdsModule { }
