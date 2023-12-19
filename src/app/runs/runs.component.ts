import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'gcp-runs',
  standalone: true,
  imports: [RouterModule],
  template: '<router-outlet></router-outlet>'
})
export class RunsComponent {

  constructor() { }

}
