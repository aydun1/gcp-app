import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';

import { DeliveryService } from '../delivery.service';
import { Order } from '../order';


interface Data {
  sopType: number;
  sopNumber: string;
}

@Component({
  selector: 'gcp-order-lines-dialog',
  templateUrl: './order-lines-dialog.component.html',
  styleUrls: ['./order-lines-dialog.component.css']
})
export class OrderLinesDialogComponent implements OnInit {
  public order$!: Observable<Order>;
  public loading = true;
  public palletSpaces!: number;

  constructor(
    public dialogRef: MatDialogRef<OrderLinesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.order$ = this.deliveryService.getOrder(this.data.sopType, this.data.sopNumber).pipe(
      tap(_ => {
        this.palletSpaces = _.lines.reduce((acc, cur) => acc += +cur.palletSpaces, 0);
        this.loading = false;
      })
    );
  }

}
