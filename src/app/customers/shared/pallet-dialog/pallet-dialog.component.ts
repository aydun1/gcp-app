import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-pallet-dialog',
  templateUrl: './pallet-dialog.component.html',
  styleUrls: ['./pallet-dialog.component.css']
})
export class PalletDialogComponent implements OnInit {

  constructor(
      public dialogRef: MatDialogRef<PalletDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private customersService: CustomersService
  ) { }

  ngOnInit(): void {
  }

  addPallets() {
    const inQty = 1;
    const outQty = 8;
    this.customersService.addPallets(this.data.customer, inQty, outQty).subscribe(_ => this.dialogRef.close());
  }
}
