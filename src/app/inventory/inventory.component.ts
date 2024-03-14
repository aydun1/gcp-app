import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BigButtonComponent } from '../shared/big-button/big-button.component';

@Component({
  selector: 'gcp-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],
  standalone: true,
  imports: [RouterModule, BigButtonComponent]
})
export class InventoryComponent {

}
