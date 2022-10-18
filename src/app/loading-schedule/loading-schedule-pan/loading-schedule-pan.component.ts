import { Component, HostBinding } from '@angular/core';

import { NavigationService } from '../../navigation.service';

@Component({
  selector: 'gcp-loading-schedule-pan',
  templateUrl: './loading-schedule-pan.component.html',
  styleUrls: ['./loading-schedule-pan.component.css']
})
export class LoadingSchedulePanComponent {
  @HostBinding('class') class = 'app-component mat-app-background';

  constructor(
    private navService: NavigationService
  ) { }

  goBack(): void {
    this.navService.back();
  }

}
