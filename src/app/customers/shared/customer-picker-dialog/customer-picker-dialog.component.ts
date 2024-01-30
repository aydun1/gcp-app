import { Component, Inject, OnInit } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Observable, tap } from 'rxjs';

import { Address } from '../address';
import { Customer } from '../customer';
import { Site } from '../site';
import { CustomersService } from '../customers.service';
import { SharedService } from '../../../shared.service';
import { Vendor } from '../vendor';
import { CustomerControlComponent } from '../../../shared/controls/customer-control/customer-control.component';
import { VendorControlComponent } from '../../../shared/controls/vendor-control/vendor-control.component';

interface CustomerForm {
  customer: FormControl<Customer | null>;
  vendor: FormControl<Vendor | null>;
  address: FormControl<Address | null>;
  site: FormControl<Site | null>;
  notes: FormControl<string | null>;
}

@Component({
  selector: 'gcp-customer-picker-dialog',
  templateUrl: './customer-picker-dialog.component.html',
  styleUrls: ['./customer-picker-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, NgForOf, NgIf, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, MatSelectModule, MatIconModule, MatMenuModule, CustomerControlComponent, VendorControlComponent]
})
export class CustomerPickerDialogComponent implements OnInit {
  public loading = false;
  public loadingAddresses = false;
  public loadingSites = false;
  public customerForm!: FormGroup<CustomerForm>;
  public sites$!: Observable<Site[]>;
  public addresses$!: Observable<Address[]>;
  public branch!: string;
  public searchType = 'Customers';
  public get branches(): Array<string> {return this.shared.branches}
  public tidyAddress!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {notes: boolean, address: boolean, title: string} | undefined,
    private dialogRef: MatDialogRef<CustomerPickerDialogComponent>,
    private fb: FormBuilder,
    private customersService: CustomersService,
    private shared: SharedService,
  ) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      customer: new FormControl(null as unknown as Customer, [Validators.required]),
      vendor: new FormControl(null as unknown as Vendor, []),
      address: new FormControl(),
      site: new FormControl(),
      notes: new FormControl(),
    });

    this.shared.getBranch().subscribe(_ => this.branch = _);
    this.customerForm.get('customer')?.valueChanges.subscribe(_ => {
      this.customerForm.get('address')?.reset();
      this.customerForm.get('site')?.reset();
      if (_) {
        this.getCustomerAddresses(_);
        this.getSites(_);
      }
    });

    this.customerForm.get('vendor')?.valueChanges.subscribe(_ => {
      this.customerForm.get('address')?.reset();
      this.customerForm.get('site')?.reset();
      if (_) {
        this.getVendorAddresses(_);
      }
    });

    this.customerForm.get('address')?.valueChanges.subscribe(_ =>
      this.tidyAddress = _ ? this.shared.addressFormatter(_) : ''
    );
    this.customerForm.get('site')?.valueChanges.subscribe(_ => {
      if (_) this.tidyAddress = _.fields.Address;
    });
  }

  getCustomerAddresses(customer: Customer): void {
    const addField = this.customerForm.get('address');
    if (this.data?.address) {
      this.loadingAddresses = true;
      addField?.disable();
    }
    this.addresses$ = this.customersService.getCustomerAddresses(customer.custNmbr).pipe(
      tap(_ => {
        this.loadingAddresses = false;
        addField?.enable();
      })
    );
  }

  getVendorAddresses(vendor: Vendor): void {
    const addField = this.customerForm.get('address');
    if (this.data?.address) {
      this.loadingAddresses = true;
      addField?.disable();
    }
    this.addresses$ = this.customersService.getVendorAddresses(vendor.vendId).pipe(
      tap(_ => {
        this.loadingAddresses = false;
        addField?.enable();
      })
    );
  }

  getSites(customer: Customer): void {
    this.loadingSites = true;
    this.sites$ = this.customersService.getSites(customer.custNmbr).pipe(
      tap(_ => {
        this.customerForm.patchValue({site: _.length > 0 ? _[0] : null});
        this.loadingSites = false;
        this.loadingAddresses = false;
      })
    );
  }

  pickCustomer(): void {
    if (this.customerForm.invalid) return;
    const customer: Partial<Customer> = {
      name: this.customerForm.get('customer')?.value?.name || this.customerForm.get('vendor')?.value?.name || '',
      custNmbr: this.customerForm.get('customer')?.value?.custNmbr || this.customerForm.get('vendor')?.value?.vendId || ''
    };
    const address = this.customerForm.get('address')?.value as Address;
    const site = this.customerForm.get('site')?.value as Site;
    const notes = this.customerForm.get('notes')?.value as string;
    const customerType = this.searchType;
    this.dialogRef.close({customer, site, address, notes, customerType});
  }

  setSearchType(searchType: string): void {
    this.searchType = searchType;
    if (searchType === 'Customers') {
      this.customerForm.get('customer')?.removeValidators(Validators.required);
      this.customerForm.get('vendor')?.clearValidators();
      this.customerForm.reset();
    } else if (searchType === 'Vendors') {
      this.customerForm.get('vendor')?.removeValidators(Validators.required);
      this.customerForm.get('customer')?.clearValidators();
      this.customerForm.reset();
    }
  }

  setBranch(branch: string): void {
    this.branch = branch;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}