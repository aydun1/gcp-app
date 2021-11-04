import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
      private customersService: CustomersService,
      private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
  }

  addPallets() {
    const inQty = 1;
    const outQty = 8;
    this.customersService.addPallets(this.data.customer, inQty, outQty).toPromise().then(
      _ => this.dialogRef.close()
    ).catch(
      _ => {console.log(_);this.snackBar.open(_.error?.error?.message, '', {duration: 3000})}
    )
  }
}
