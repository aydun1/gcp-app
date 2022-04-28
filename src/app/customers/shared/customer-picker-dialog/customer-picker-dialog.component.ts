import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { map, Observable, tap } from 'rxjs';

import { CustomersService } from '../customers.service';
import { Customer } from '../customer';
import { Site } from '../site';
import { SharedService } from '../../../shared.service';

@Component({
  selector: 'gcp-customer-picker-dialog',
  templateUrl: './customer-picker-dialog.component.html',
  styleUrls: ['./customer-picker-dialog.component.css']
})
export class CustomerPickerDialogComponent implements OnInit {
  public loading: boolean;
  public customerForm: FormGroup;
  public sites$: Observable<string[]>;
  public branch: string;
  public get branches(): Array<string> {return this.shared.branches};

  constructor(
    private dialogRef: MatDialogRef<CustomerPickerDialogComponent>,
    private fb: FormBuilder,
    private customersService: CustomersService,
    private shared: SharedService,
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
      map(_ => _.map(site => site.fields.Title)),
      tap(_ => this.customerForm.patchValue({site: _.length > 0 ? _[0] : ''}))
    );
  }

  pickCustomer(): void {
    if (this.customerForm.invalid) return;
    const customer = this.customerForm.get('customer').value as Customer;
    const site = this.customerForm.get('site').value as Site;
    this.dialogRef.close({customer, site});
  }

  setBranch(branch: string): void {
    this.branch = branch;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}