import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';

import { SharedService } from '../../../shared.service';
import { DeliveryService } from '../delivery.service';
import { Order } from '../order';
import { PalletDialogComponent } from '../../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { PalletsService } from '../../../pallets/shared/pallets.service';


interface Data {
  sopType: number;
  sopNumber: string;
};
interface PalletQuantity {ins: number, outs: number};
interface PalletQuantities {
  Loscam: PalletQuantity;
  Chep: PalletQuantity;
  GCP: PalletQuantity;
  Plain: PalletQuantity;
};

@Component({
  selector: 'gcp-order-lines-dialog',
  templateUrl: './order-lines-dialog.component.html',
  styleUrls: ['./order-lines-dialog.component.css']
})
export class OrderLinesDialogComponent implements OnInit {
  private _palletsSubject$ = new Subject<string>();

  public order$!: Observable<Order | undefined>;
  public loading = true;
  public palletSpaces!: number;
  public orderWeight!: number;
  public palletsOwing!: PalletQuantities | null;
  public pallets = this.sharedService.palletDetails;
  public address!: string;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<OrderLinesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private sharedService: SharedService,
    private deliveryService: DeliveryService,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    this.order$ = this.deliveryService.getOrder(this.data.sopType, this.data.sopNumber).pipe(
      tap(_ => {
        this.palletSpaces = _.lines.reduce((acc, cur) => acc += +cur.palletSpaces, 0);
        this.orderWeight = _.
        lines.reduce((acc, cur) => acc += +cur.lineWeight, 0);
        this._palletsSubject$.next(this.data.sopNumber);
        this.address = (_.cntPrsn ? _.cntPrsn + '\r\n' : '') + [_.address1, _.address2, _.address3].filter(_ => _).join('\r\n') + '\r\n' +
        [_.city, _.state, _.postCode].filter(_ => _).join(' ');
        this.loading = false;
      }),
      catchError(_ => {
        this.closeDialog();
        return of(undefined);
      })
    );

    this._palletsSubject$.pipe(
      tap(() => this.palletsOwing = null),
      switchMap(id => this.palletsService.getOrderPallets(id, '', '')),
    ).subscribe(pallets => this.palletsOwing = pallets);
  }

  openPalletDialog(name: string, custNmbr: string, orderNmbr: string, site: string): void {
    const customer = {name, custNmbr};
    const data = {customer, site, orderNmbr: orderNmbr || ''};
    const palletDialog = this.dialog.open(PalletDialogComponent, {width: '600px', data, autoFocus: false});
    palletDialog.afterClosed().subscribe(
      _ => this._palletsSubject$.next(this.data.sopNumber)
    )
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

}
