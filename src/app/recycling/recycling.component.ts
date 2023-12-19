import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BigButtonComponent } from '../shared/big-button/big-button.component';

@Component({
  selector: 'gcp-recycling',
  templateUrl: './recycling.component.html',
  styleUrls: ['./recycling.component.css'],
  standalone: true,
  imports: [RouterModule, BigButtonComponent]
})
export class RecyclingComponent {

  constructor() { }

}
