import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';

import { CustomerControlComponent } from './customer-control/customer-control.component';
import { ItemControlComponent } from './item-control/item-control.component';

@NgModule({
  declarations: [
    CustomerControlComponent,
    ItemControlComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatInputModule
  ],
  exports: [
    CustomerControlComponent,
    ItemControlComponent
  ],
})
export class ControlsModule {}