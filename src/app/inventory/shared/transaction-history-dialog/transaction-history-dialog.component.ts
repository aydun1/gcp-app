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
          this.sites.map(s => this.item[s.onHand] !== _[s.onHand]).some(v => v === true) ||
          this.sites.map(s => this.item[s.alloc] !== _[s.alloc]).some(v => v === true)
        )
      ) this.stockChanged = true;
      this.sites.forEach(s => this.item[s.onHand] = _[s.onHand]);
      this.sites.forEach(s => this.item[s.alloc] = _[s.alloc]);
    });
  }

  getPreviousOrders(branch: string) {
    console.log(this.branch)
    this.branch = this.branch && this.branch === branch ? '' : branch;
    this.previousOrders = this.inventoryService.getTransactions(this.branch, this.data.itemNmbr);
  }
}
