import { Component, OnInit } from '@angular/core';

import { SharedService } from '../shared.service';
import { BigButtonComponent } from '../shared/big-button/big-button.component';

@Component({
  selector: 'gcp-home',
  templateUrl: './home.component.html',
  styles: ['.container { max-width: 1024px; margin: 0 auto; }'],
  standalone: true,
  imports: [BigButtonComponent]
})
export class HomeComponent implements OnInit {
  public warehouse!: boolean;
  public roles!: any;

  constructor(
   private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.warehouse = this.sharedService.isWarehouse;
    this.roles = this.sharedService.getRoles();
  }
}