import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BigButtonComponent } from '../shared/big-button/big-button.component';

@Component({
  selector: 'gcp-interstate-transfers',
  templateUrl: './interstate-transfers.component.html',
  styleUrls: ['./interstate-transfers.component.css'],
  standalone: true,
  imports: [RouterModule, BigButtonComponent]
})
export class InterstateTransfersComponent {

}
