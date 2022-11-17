import { Component, OnInit, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

import { SharedService } from '../../../app/shared.service';

@Component({
  selector: 'gcp-transaction-history-dialog',
  templateUrl: './transaction-history-dialog.component.html',
  styleUrls: ['./transaction-history-dialog.component.css']
})
export class TransactionHistoryDialogComponent implements OnInit {
  public locationHistory!: Promise<Array<any>>;

  constructor(
    public dialogRef: MatDialogRef<TransactionHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.locationHistory = this.sharedService.getTransactions(this.data.branch, this.data.itemNmbr);
  }

}
