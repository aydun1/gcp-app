import { Component, HostBinding, OnInit } from '@angular/core';
import { NavigationService } from 'src/app/navigation.service';

@Component({
  selector: 'gcp-loading-schedule-view',
  templateUrl: './loading-schedule-view.component.html',
  styleUrls: ['./loading-schedule-view.component.css']
})
export class LoadingScheduleViewComponent {
  @HostBinding('class') class = 'app-component';

  constructor(
    private navService: NavigationService,
  ) { }

  goBack(): void {
    this.navService.back();
  }
}
