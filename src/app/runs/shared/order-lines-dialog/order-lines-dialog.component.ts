import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';

import { DeliveryService } from '../delivery.service';
import { Line } from '../line';


interface Data {
  custNmbr: string;
  sopType: number;
  sopNumber: string;
  custName: string;
}

@Component({
  selector: 'gcp-order-lines-dialog',
  templateUrl: './order-lines-dialog.component.html',
  styleUrls: ['./order-lines-dialog.component.css']
})
export class OrderLinesDialogComponent implements OnInit {
  public orderLines$!: Observable<Line[]>;
  public loading = true;
  public palletSpaces!: number;

  constructor(
    public dialogRef: MatDialogRef<OrderLinesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.orderLines$ = this.deliveryService.getOrderLines(this.data.sopType, this.data.sopNumber).pipe(
      tap(_ => {
        this.palletSpaces = _.reduce((acc, cur) => acc += +cur.palletSpaces, 0);
        this.loading = false;
      })
    );
  }

}
