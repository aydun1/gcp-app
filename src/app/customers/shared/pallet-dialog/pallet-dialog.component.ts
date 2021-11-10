import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, tap, throwError } from 'rxjs';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-pallet-dialog',
  templateUrl: './pallet-dialog.component.html',
  styleUrls: ['./pallet-dialog.component.css']
})
export class PalletDialogComponent implements OnInit {
  public palletForm: FormGroup;
  public loading: boolean;

  constructor(
      public dialogRef: MatDialogRef<PalletDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private customersService: CustomersService,
      private snackBar: MatSnackBar,
      private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.palletForm = this.fb.group({
      palletType: ['', Validators.required],
      inQty: ['', Validators.required],
      outQty: ['', Validators.required],
      notes: ['']
    });

  }

  addPallets() {
    if (this.palletForm.invalid) return;
    this.loading = true;
    this.customersService.addPallets(this.data.customer, this.palletForm.value).pipe(
      tap(_ => {
        this.dialogRef.close();
        this.snackBar.open('Successfully transferred pallets', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe()
  }
}
