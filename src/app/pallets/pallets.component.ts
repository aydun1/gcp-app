import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BigButtonComponent } from '../shared/big-button/big-button.component';

@Component({
  selector: 'gcp-pallets',
  templateUrl: './pallets.component.html',
  styleUrls: ['./pallets.component.css'],
  standalone: true,
  imports: [RouterModule, BigButtonComponent]
})
export class PalletsComponent {

  constructor() { }

}
