import { Component, HostBinding } from '@angular/core';

import { NavigationService } from '../navigation.service';

@Component({
  selector: 'gcp-pan-list',
  templateUrl: './pan-list.component.html',
  styleUrls: ['./pan-list.component.css']
})
export class PanListComponent {
  @HostBinding('class') class = 'app-component mat-app-background';

  constructor(
    private navService: NavigationService
  ) { }

  goBack(): void {
    this.navService.back();
  }

}
