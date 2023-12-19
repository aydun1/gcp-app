import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'gcp-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.css'],
  standalone: true,
  imports: [MatProgressSpinnerModule]
})
export class LoadingPageComponent {

  constructor() { }

}
