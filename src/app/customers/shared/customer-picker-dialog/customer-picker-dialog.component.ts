import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';

import { Address } from '../address';
import { Customer } from '../customer';
import { Site } from '../site';
import { CustomersService } from '../customers.service';
import { SharedService } from '../../../shared.service';

@Component({
  selector: 'gcp-customer-picker-dialog',
  templateUrl: './customer-picker-dialog.component.html',
  styleUrls: ['./customer-picker-dialog.component.css']
})
export class CustomerPickerDialogComponent implements OnInit {
  public loading = false;
  public loadingAddresses = false;
  public loadingSites = false;
  public customerForm!: FormGroup;
  public sites$!: Observable<Site[]>;
  public addresses$!: Observable<Address[]>;
  public branch!: string;
  public get branches(): Array<string> {return this.shared.branches};
  public address!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {notes: boolean, address: boolean},
    private dialogRef: MatDialogRef<CustomerPickerDialogComponent>,
    private fb: FormBuilder,
    private customersService: CustomersService,
    private shared: SharedService,
  ) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      customer: new FormControl<Customer | null>(null, [Validators.required]),
      address: new FormControl<Address | null>(null),
      site: new FormControl<Site | null>(null),
      notes: new FormControl<string | null>(null),
    });
    this.shared.getBranch().subscribe(_ => this.branch = _);
    this.customerForm.get('customer')?.valueChanges.subscribe(_ => {
      this.getAddresses(_);
      this.getSites(_);
    });
    this.customerForm.get('address')?.valueChanges.subscribe(_ => {
      const lastLine = [_.city, _.stateorprovince, _.postalcode];
      this.address = [_.line1, _.line2, _.line3, lastLine.join(' ')].filter(_ => _).join('\r\n');
    });
    this.customerForm.get('site')?.valueChanges.subscribe(_ => {
      if (_) this.address = _.fields.Address;
    });
  }

  getAddresses(customer: Customer): void {
    if (this.data?.address) this.loadingAddresses = true;
    this.addresses$ = this.customersService.getAddresses(customer.accountnumber).pipe(
      tap(_ => {
        this.loadingAddresses = false;
      })
    );
  }

  getSites(customer: Customer): void {
    this.loadingSites = true;
    this.sites$ = this.customersService.getSites(customer.accountnumber).pipe(
      tap(_ => {
        this.customerForm.patchValue({site: _.length > 0 ? _[0] : null});
        this.loadingSites = false;
      })
    );
  }

  pickCustomer(): void {
    if (this.customerForm.invalid) return;
    const customer = this.customerForm.get('customer')?.value as Customer;
    const site = this.customerForm.get('site')?.value as Site;
    const notes = this.customerForm.get('notes')?.value as string;
    this.dialogRef.close({customer, site, address: this.address, notes});
  }

  setBranch(branch: string): void {
    this.branch = branch;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}