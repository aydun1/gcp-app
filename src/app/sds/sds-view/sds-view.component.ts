import { Component, HostBinding } from '@angular/core';
import { NavigationService } from 'src/app/navigation.service';

@Component({
  selector: 'gcp-sds-view',
  templateUrl: './sds-view.component.html',
  styleUrls: ['./sds-view.component.css']
})
export class SdsViewComponent {
  @HostBinding('class') class = 'app-component mat-app-background';

  constructor(
    private navService: NavigationService
  ) {}
  goBack(): void {
    this.navService.back();
  }
}
