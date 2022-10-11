import { Component } from '@angular/core';
import { SharedService } from '../shared.service';

@Component({
  selector: 'gcp-interstate-transfers',
  templateUrl: './interstate-transfers.component.html',
  styleUrls: ['./interstate-transfers.component.css']
})
export class InterstateTransfersComponent {
  public isQld = false;
  constructor(
    private shared: SharedService
  ) {
    this.isQld = this.shared.branch === 'QLD';
  }

}
