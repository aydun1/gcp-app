import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

import { SharedModule } from '../shared/shared.module';
import { ChemicalsComponent } from './chemicals.component';
import { ChemicalListComponent } from './chemical-list/chemical-list.component';
import { ChemicalsRoutingModule } from './chemicals-routing.module';
import { ChemicalViewComponent } from './chemical-view/chemical-view.component';
import { ChemicalBackpackDialogComponent } from './shared/chemical-backpack-dialog/chemical-backpack-dialog.component';
import { ChemicalOthersDialogComponent } from './shared/chemical-others-dialog/chemical-others-dialog.component';
import { ChemicalManifestDialogComponent } from './shared/chemical-manifest-dialog/chemical-manifest-dialog.component';

@NgModule({
  declarations: [
    ChemicalsComponent,
    ChemicalListComponent,
    ChemicalViewComponent,
    ChemicalBackpackDialogComponent,
    ChemicalOthersDialogComponent,
    ChemicalManifestDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ChemicalsRoutingModule,
    MatTabsModule
  ],
  providers: [
  ]
})
export class ChemicalsModule { }
