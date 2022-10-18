import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SharedModule } from '../shared/shared.module';
import { PanListService } from './pan-list.service';
import { PipeModule } from '../shared/pipes/pipe.module';
import { PanListSimpleComponent } from './pan-list-simple/pan-list-simple.component';
import { PanListITTComponent } from './pan-list-itt/pan-list-itt.component';

@NgModule({
  declarations: [
    PanListITTComponent,
    PanListSimpleComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatProgressSpinnerModule,
    PipeModule
  ],
  exports: [
    PanListITTComponent,
    PanListSimpleComponent
  ],
  providers: [
    PanListService
  ]
})
export class PanListModule { }
