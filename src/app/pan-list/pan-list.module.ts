import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SharedModule } from '../shared/shared.module';
import { PanListService } from './pan-list.service';
import { PipeModule } from '../shared/pipes/pipe.module';
import { PanListSimpleComponent } from './pan-list-simple/pan-list-simple.component';
import { PanListComponent } from './pan-list/pan-list.component';

@NgModule({
  declarations: [
    PanListComponent,
    PanListSimpleComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatProgressSpinnerModule,
    PipeModule
  ],
  exports: [
    PanListComponent,
    PanListSimpleComponent
  ],
  providers: [
    PanListService
  ]
})
export class PanListModule { }
