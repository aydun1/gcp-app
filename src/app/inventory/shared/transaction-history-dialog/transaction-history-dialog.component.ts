import { Component, OnInit, Inject } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InventoryService } from '../inventory.service';
import { SuggestedItem } from '../../../shared/pan-list/suggested-item';

interface Data {
  branch: string;
  itemNmbr: string;
  item: SuggestedItem;
  warn: boolean;
}

@Component({
  selector: 'gcp-transaction-history-dialog',
  templateUrl: './transaction-history-dialog.component.html',
  styleUrls: ['./transaction-history-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, MatDialogModule, MatDividerModule, MatProgressSpinnerModule]
})
export class TransactionHistoryDialogComponent implements OnInit {
  public previousOrders!: Promise<any[]>;
  public averages!: Promise<any>;
  public item: SuggestedItem = {} as SuggestedItem;
  public stockChanged!: boolean;
  public branch!: string;
  public sites = [
    {id: 'MAIN', class: 'cell-vic', onHand: 'OnHandVIC', alloc: 'AllocVIC'},
    {id: 'NSW', class: 'cell-nsw', onHand: 'OnHandNSW', alloc: 'AllocNSW'},
    {id: 'QLD', class: 'cell-qld', onHand: 'OnHandQLD', alloc: 'AllocQLD'},
    {id: 'SA', class: 'cell-sa', onHand: 'OnHandSA', alloc: 'AllocSA'},
    {id: 'WA', class: 'cell-wa', onHand: 'OnHandWA', alloc: 'AllocWA'},
    {id: 'HEA', class: 'cell-hea', onHand: 'OnHandHEA', alloc: 'AllocHEA'}
  ];

  constructor(
    public dialogRef: MatDialogRef<TransactionHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.item = {...this.data.item};
    this.getPreviousOrders(this.data.branch);
    this.inventoryService.getStock(this.data.itemNmbr);
    this.averages = this.inventoryService.getHistory(this.data.itemNmbr);
    this.inventoryService.getStock(this.data.itemNmbr).then(_ => {
      if (
        this.data.warn !== false && (
          this.item.OnHandVIC !== _.OnHandVIC ||
          this.item.OnHandNSW !== _.OnHandNSW ||
          this.item.OnHandQLD !== _.OnHandQLD ||
          this.item.OnHandSA !== _.OnHandSA ||
          this.item.OnHandWA !== _.OnHandWA ||
          this.item.OnHandHEA !== _.OnHandHEA ||
          this.item.AllocVIC !== _.AllocVIC ||
          this.item.AllocNSW !== _.AllocNSW ||
          this.item.AllocQLD !== _.AllocQLD ||
          this.item.AllocSA !== _.AllocSA ||
          this.item.AllocWA !== _.AllocWA ||
          this.item.AllocHEA !== _.AllocHEA
        )
      ) this.stockChanged = true;

      this.item['OnHandVIC'] = _.OnHandVIC;
      this.item['OnHandNSW'] = _.OnHandNSW;
      this.item['OnHandQLD'] = _.OnHandQLD;
      this.item['OnHandSA'] = _.OnHandSA;
      this.item['OnHandWA'] = _.OnHandWA;
      this.item['OnHandHEA'] = _.OnHandHEA;
      this.item['AllocVIC'] = _.AllocVIC;
      this.item['AllocNSW'] = _.AllocNSW;
      this.item['AllocQLD'] = _.AllocQLD;
      this.item['AllocSA'] = _.AllocSA;
      this.item['AllocWA'] = _.AllocWA;
      this.item['AllocHEA'] = _.AllocHEA;
    });
  }

  getPreviousOrders(branch: string) {
    console.log(this.branch)
    this.branch = this.branch && this.branch === branch ? '' : branch;
    this.previousOrders = this.inventoryService.getTransactions(this.branch, this.data.itemNmbr);
  }
}
