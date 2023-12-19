import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'gcp-loading-schedule',
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: [RouterModule]
})
export class LoadingScheduleComponent {

  constructor() { }

}
