import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { catchError, tap, throwError } from 'rxjs';

import { PalletsService } from '../pallets.service';
import { SharedService } from '../../../shared.service';
import { Site } from '../../../customers/shared/site';
import { Customer } from '../../../customers/shared/customer';

interface PalletForm {
  date: FormControl<Date | null>;
  inQty: FormControl<string | null>;
  notes: FormControl<string | null>;
  outQty: FormControl<string | null>;
  palletType: FormControl<string | null>;
  site: FormControl<string | null>;
}

@Component({
  selector: 'gcp-pallet-dialog',
  templateUrl: './pallet-dialog.component.html',
  styleUrls: ['./pallet-dialog.component.css']
})
export class PalletDialogComponent implements OnInit {
  private _state!: string;
  public palletForm!: FormGroup<PalletForm>;
  public loading = false;
  public siteNames!: Array<string>;

  constructor(
      public dialogRef: MatDialogRef<PalletDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string},
      private snackBar: MatSnackBar,
      private fb: FormBuilder,
      private sharedService: SharedService,
      private palletsService: PalletsService,
  ) { }

  ngOnInit(): void {
    this.sharedService.getBranch().subscribe(state => this._state = state);
    const requireSite = this.data.site || this.data.sites?.length;
    this.siteNames = this.data.sites ? this.data.sites.map(_ => _.fields.Title) : [this.data.site].filter(_ => _);
    this.palletForm = this.fb.group({
      palletType: ['', Validators.required],
      inQty: ['', [Validators.required, Validators.min(0), Validators.max(1000)]],
      outQty: ['', [Validators.required, Validators.min(0), Validators.max(1000)]],
      site: [this.data.site, requireSite ? Validators.required : ''],
      date: [new Date(), Validators.required],
      notes: ['']
    });
  }

  addPallets(): void {
    if (this.palletForm.invalid) return;
    this.loading = true;
    if (!this._state) {
      this.snackBar.open('Could not detect branch. Reload and try again.', '', {duration: 3000});
      this.loading = false;
      return;
    }
    const payload = {...this.palletForm.value, customer: this.data.customer.custNmbr, branch: this._state, customerName: this.data.customer.name};
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
