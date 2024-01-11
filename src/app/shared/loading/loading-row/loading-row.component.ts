import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'gcp-loading-row',
  templateUrl: './loading-row.component.html',
  styleUrls: ['./loading-row.component.css'],
  standalone: true,
  imports: [MatProgressSpinnerModule]
})
export class LoadingRowComponent {

  constructor() { }

}
