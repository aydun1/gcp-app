import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, tap, throwError } from 'rxjs';

import { PalletsService } from '../pallets.service';
import { SharedService } from '../../../shared.service';
import { Site } from '../../../customers/shared/site';
import { Customer } from '../../../customers/shared/customer';

interface PalletQty {
  pallet: FormControl<string | null>;
  inQty: FormControl<number | null>;
  outQty: FormControl<number | null>;
}

interface PalletForm {
  date: FormControl<Date | null>;
  notes: FormControl<string | null>;
  site: FormControl<string | null>;
  quantities: FormArray<FormGroup<PalletQty>>
}

@Component({
  selector: 'gcp-pallet-dialog',
  templateUrl: './pallet-dialog.component.html',
  styleUrls: ['./pallet-dialog.component.css']
})
export class PalletDialogComponent implements OnInit {
  private _state!: string;
  private palletImages = {
    Loscam: 'assets/loscam.png',
    Chep: 'assets/chep.png',
    GCP:'assets/pallet.png',
    Plain: 'assets/pallet.png'
  };
  public palletTypes!: Array<{name: string, image: string}>;
  public palletForm!: FormGroup<PalletForm>;
  public loading = false;
  public siteNames!: Array<string>;
  public direction = [{name: 'Sent', controlName: 'outQty'}, {name: 'Returned', controlName: 'inQty'}];
  public pallets = ['Loscam', 'Chep', 'GCP', 'Plain'];
  public vertical = true;

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
    this.palletTypes = this.pallets.map(_ => {return {name: _, image: this.palletImages[_]}});
    this.palletForm = this.fb.group({
      site: [this.data.site, requireSite ? Validators.required : ''],
      date: [new Date(), Validators.required],
      notes: [''],
      quantities: this.fb.array(this.palletTypes.map(_ => this.fb.group<PalletQty>({
        pallet: new FormControl(_.name, [Validators.required]),
        outQty: new FormControl(null, [Validators.min(0), Validators.max(1000)]),
        inQty: new FormControl(null, [Validators.min(0), Validators.max(1000)])
      })))
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
    const site = this.palletForm.get('site')?.value || '';
    const date = this.palletForm.get('date')?.value as Date;
    const notes = this.palletForm.get('notes')?.value || '';
    const transfers = this.palletForm.get('quantities')?.value
    this.palletsService.customerPalletTransferMulti(this.data.customer.name, this.data.customer.custNmbr, this._state, site, date, notes, transfers).pipe(
      tap(_ => {
        this.dialogRef.close();
        this.snackBar.open('Successfully transferred pallets', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
