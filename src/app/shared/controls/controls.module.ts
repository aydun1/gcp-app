import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { CustomerControlComponent } from './customer-control/customer-control.component';
import { VendorControlComponent } from './vendor-control/vendor-control.component';
import { ItemControlComponent } from './item-control/item-control.component';

@NgModule({
  declarations: [
    CustomerControlComponent,
    VendorControlComponent,
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
    VendorControlComponent,
    ItemControlComponent
  ],
})
export class ControlsModule {}