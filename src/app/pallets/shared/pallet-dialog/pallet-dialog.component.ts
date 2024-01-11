import { Component, Inject, OnInit } from '@angular/core';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, startWith, tap, throwError } from 'rxjs';

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
  styleUrls: ['./pallet-dialog.component.css'],
  standalone: true,
  imports: [NgClass, NgForOf, NgIf, AsyncPipe, ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatDialogModule, MatDividerModule, MatIconModule, MatInputModule, MatSelectModule]
})
export class PalletDialogComponent implements OnInit {
  private _state!: string;
  public palletTypes = this.sharedService.palletDetails;
  public palletForm!: FormGroup<PalletForm>;
  public loading = false;
  public siteNames!: Array<string>;
  public direction = [{name: 'Sent', controlName: 'outQty'}, {name: 'Returned', controlName: 'inQty'}];
  public vertical = true;
  public palletsOwed = this.palletsService.getPalletsOwedByCustomer(this.data.customer.custNmbr, undefined).pipe(
    startWith(this.palletTypes.reduce((acc, cur) => {return {...acc, [cur.key]: {total: '...'}}}, {}))
  );

  constructor(
      public dialogRef: MatDialogRef<PalletDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string, orderNmbr: string},
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
    this.palletsService.customerPalletTransferMulti(this.data.customer.name, this.data.customer.custNmbr, this._state, site, date, this.data.orderNmbr, notes, transfers).pipe(
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
