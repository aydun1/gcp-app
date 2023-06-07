import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';

import { DeliveryService } from '../delivery.service';
import { Order } from '../order';
import { PalletDialogComponent } from '../../../pallets/shared/pallet-dialog/pallet-dialog.component';


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
  public orderWeight!: number;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<OrderLinesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.order$ = this.deliveryService.getOrder(this.data.sopType, this.data.sopNumber).pipe(
      tap(_ => {
        this.palletSpaces = _.lines.reduce((acc, cur) => acc += +cur.palletSpaces, 0);
        this.orderWeight = _.lines.reduce((acc, cur) => acc += +cur.lineWeight, 0);
        this.loading = false;
      })
    );
  }

  openPalletDialog(name: string, custNmbr: string, orderNmbr: string, site: string): void {
    const customer = {name, custNmbr};
    const data = {customer, site, orderNmbr: orderNmbr || ''};
    const palletDialog = this.dialog.open(PalletDialogComponent, {width: '600px', data, autoFocus: false});
    palletDialog.afterClosed().subscribe(
      _ => console.log(_)
    )
  }
}
