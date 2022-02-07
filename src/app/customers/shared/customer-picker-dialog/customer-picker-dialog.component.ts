import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { CustomersService } from '../customers.service';
import { Customer } from '../customer';
import { Site } from '../site';
import { RecyclingService } from '../../../recycling/shared/recycling.service';
import { SharedService } from '../../../shared.service';

@Component({
  selector: 'gcp-customer-picker-dialog',
  templateUrl: './customer-picker-dialog.component.html',
  styleUrls: ['./customer-picker-dialog.component.css']
})
export class CustomerPickerDialogComponent implements OnInit {
  public loading: boolean;
  public customerForm: FormGroup;
  public sites$: Observable<Site[]>;
  public branch: string;
  public get branches(): Array<string> {return this.shared.branches};

  constructor(
    private dialogRef: MatDialogRef<CustomerPickerDialogComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private customersService: CustomersService,
    private recyclingService: RecyclingService,
    private shared: SharedService,
    @Inject(MAT_DIALOG_DATA) private data: {id: string}

  ) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      customer: ['', Validators.required],
      site: ''
    });
    this.shared.getBranch().subscribe(_ => this.branch = _);
    this.customerForm.get('customer').valueChanges.subscribe(_ => this.getSites(_));
  }

  getSites(customer: Customer): void {
    this.sites$ = this.customersService.getSites(customer.accountnumber).pipe(
      tap(_ => this.customerForm.patchValue({site: _.length > 0 ? _[0] : ''}))
    );
  }

  assignToCustomer(): void {
    if (this.customerForm.invalid) return;
    this.loading = true;
    const customer = this.customerForm.get('customer').value as Customer;
    const site = this.customerForm.get('site').value as Site;
    this.recyclingService.allocateToCustomer(this.data.id, customer.accountnumber, customer.name, site ? site.fields.Title : '').pipe(
      tap(_ => {
        this.dialogRef.close();
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  setBranch(branch: string): void {
    this.branch = branch;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}