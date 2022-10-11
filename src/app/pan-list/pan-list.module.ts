import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SharedModule } from '../shared/shared.module';
import { PanListService } from './pan-list.service';
import { PipeModule } from '../shared/pipes/pipe.module';
import { PanListComponent } from './pan-list.component';
import { PanListSimpleComponent } from './pan-list-simple/pan-list-simple.component';
import { PanListITTComponent } from './pan-list-itt/pan-list-itt.component';

@NgModule({
  declarations: [
    PanListComponent,
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
    PanListComponent,
    PanListITTComponent,
    PanListSimpleComponent
  ],
  providers: [
    PanListService
  ]
})
export class PanListModule { }
