import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { Site } from '../site';
import { Customer } from '../customer';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'gcp-customer-site-dialog',
  templateUrl: './customer-site-dialog.component.html',
  styleUrls: ['./customer-site-dialog.component.css']
})
export class CustomerSiteDialogComponent implements OnInit {
  public siteForm: FormGroup;
  public loading: boolean;
  public sites$: Observable<Site[]>;
  public siteId: string;
  public oldName: string;

  constructor(
    private dialogRef: MatDialogRef<CustomerSiteDialogComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private customerService: CustomersService,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer}
  ) { }

  ngOnInit(): void {
    this.siteForm = this.fb.group({
      site: ['', Validators.required]
    });
    this.getSites();
  }

  getSites(): void {
    this.sites$ = this.customerService.getSites(this.data.customer.accountnumber);
  }

  addSite(): void {
    if (this.siteForm.invalid) return;
    this.loading = true;
    const action = this.siteId ? this.renameSite(this.siteId) : this.customerService.addSite(this.data.customer.accountnumber, this.siteForm.value['site'] );
    action.pipe(
      tap(_ => {
        this.dialogRef.close();
        this.snackBar.open(`Successfully ${this.siteId ? 'renamed' : 'added new'} site`, '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe()
  }

  openEditor(id: string, name: string): void {
    this.siteId = id;
    this.oldName = name;
    this.siteForm.patchValue({site: name});
  }

  renameSite(siteId: string) {
    const customer = this.data.customer;
    const newName = this.siteForm.value['site'];
    return this.customerService.renameSite(customer, siteId, newName, this.oldName);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
