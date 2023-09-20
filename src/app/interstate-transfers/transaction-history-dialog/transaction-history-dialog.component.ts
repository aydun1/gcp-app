import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SharedService } from '../../../app/shared.service';

interface Data {
  branch: string;
  itemNmbr: string;
  item: any
}

@Component({
  selector: 'gcp-transaction-history-dialog',
  templateUrl: './transaction-history-dialog.component.html',
  styleUrls: ['./transaction-history-dialog.component.css']
})
export class TransactionHistoryDialogComponent implements OnInit {
  public previousOrders!: Promise<Array<any>>;
  public averages!: Promise<any>;
  public item: any = {};
  public stockChanged!: boolean;
  constructor(
    public dialogRef: MatDialogRef<TransactionHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.item = {...this.data.item};
    this.previousOrders = this.sharedService.getTransactions(this.data.branch, this.data.itemNmbr);
    this.sharedService.getStock(this.data.itemNmbr);
    this.averages = this.sharedService.getHistory(this.data.itemNmbr);
    this.sharedService.getStock(this.data.itemNmbr).then(_ => {
      if (
        this.item['vicOnHand'] !== _['OnHandVIC'] ||
        this.item['nswOnHand'] !== _['OnHandNSW'] ||
        this.item['qldOnHand'] !== _['OnHandQLD'] ||
        this.item['saOnHand'] !== _['OnHandSA'] ||
        this.item['waOnHand'] !== _['OnHandWA'] ||
        this.item['heaOnHand'] !== _['OnHandHEA'] ||
        this.item['vicAlloc'] !== _['AllocVIC'] ||
        this.item['nswAlloc'] !== _['AllocNSW'] ||
        this.item['qldAlloc'] !== _['AllocQLD'] ||
        this.item['saAlloc'] !== _['AllocSA'] ||
        this.item['waAlloc'] !== _['AllocWA'] ||
        this.item['heaAlloc'] !== _['AllocHEA']
      ) this.stockChanged = true;
      
      this.item['vicOnHand'] = _['OnHandVIC'];
      this.item['nswOnHand'] = _['OnHandNSW'];
      this.item['qldOnHand'] = _['OnHandQLD'];
      this.item['saOnHand'] = _['OnHandSA'];
      this.item['waOnHand'] = _['OnHandWA'];
      this.item['heaOnHand'] = _['OnHandHEA'];
      this.item['vicAlloc'] = _['AllocVIC'];
      this.item['nswAlloc'] = _['AllocNSW'];
      this.item['qldAlloc'] = _['AllocQLD'];
      this.item['saAlloc'] = _['AllocSA'];
      this.item['waAlloc'] = _['AllocWA'];
      this.item['heaAlloc'] = _['AllocHEA'];
    });
  }  
}
