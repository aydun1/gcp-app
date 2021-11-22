import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, tap, throwError } from 'rxjs';

import { Site } from 'src/app/customers/shared/site';
import { Customer } from '../../../customers/shared/customer';
import { SharedService } from '../../../shared.service';
import { PalletsService } from '../pallets.service';

@Component({
  selector: 'gcp-pallet-dialog',
  templateUrl: './pallet-dialog.component.html',
  styleUrls: ['./pallet-dialog.component.css']
})
export class PalletDialogComponent implements OnInit {
  private _state: string;
  public palletForm: FormGroup;
  public loading: boolean;

  constructor(
      public dialogRef: MatDialogRef<PalletDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string},
      private snackBar: MatSnackBar,
      private fb: FormBuilder,
      private sharedService: SharedService,
      private palletsService: PalletsService,
  ) { }

  ngOnInit(): void {
    this.sharedService.getState().subscribe(state => {
      this._state = state;
    });

    const selectedSite = this.data.sites.find(_ => _.fields.Title === this.data.site);
    this.palletForm = this.fb.group({
      palletType: ['', Validators.required],
      inQty: ['', Validators.required],
      outQty: ['', Validators.required],
      site: [selectedSite, this.data.sites.length ? Validators.required : ''],
      notes: ['']
    });
  }

  addPallets(): void {
    if (this.palletForm.invalid) return;
    console.log(this.data);
    this.loading = true;
    const payload = {...this.palletForm.value, customer: this.data.customer.accountnumber, state: this._state, customerName: this.data.customer.name};
    this.palletsService.customerPalletTransfer(payload).pipe(
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

  closeDialog(): void {
    this.dialogRef.close();
  }
}
