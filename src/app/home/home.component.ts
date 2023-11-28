import { Component, OnInit } from '@angular/core';

import { SharedService } from '../shared.service';

@Component({
  selector: 'gcp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  public warehouse!: boolean;
  public roles!: any;

  constructor(
   private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.warehouse = this.sharedService.isWarehouse;
    this.roles = this.sharedService.getRoles();
  }
}