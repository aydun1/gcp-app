import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { SdsComponent } from './sds.component';
import { SdsListComponent } from './sds-list/sds-list.component';
import { SdsRoutingModule } from './sds-routing.module';
import { SdsViewComponent } from './sds-view/sds-view.component';

@NgModule({
  declarations: [
    SdsComponent,
    SdsListComponent,
    SdsViewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SdsRoutingModule
  ],
  providers: [
  ]
})
export class SdsModule { }
