import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { CustomersService } from '../customers.service';

@Component({
  selector: 'gcp-customer-site-dialog',
  templateUrl: './customer-site-dialog.component.html',
  styleUrls: ['./customer-site-dialog.component.css']
})
export class CustomerSiteDialogComponent implements OnInit {
  public siteForm: FormGroup;
  public loading: boolean;
  public sites$: Observable<any>;
  public edit: string;

  constructor(
    public dialogRef: MatDialogRef<CustomerSiteDialogComponent>,
    public fb: FormBuilder,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {customer: string},
    private customerService: CustomersService
  ) { }

  ngOnInit(): void {
    this.siteForm = this.fb.group({
      site: ['', Validators.required]
    });
    this.getSites();
  }

  getSites() {
    this.sites$ = this.customerService.getSites(this.data.customer)
  }

  addSite() {
    if (this.siteForm.invalid) return;
    this.loading = true;
    const action = this.edit ? this.customerService.renameSite(this.edit, this.siteForm.value['site'] ) : this.customerService.addSite(this.data.customer, this.siteForm.value['site'] );
    action.pipe(
      tap(_ => {
        this.dialogRef.close();
        this.snackBar.open(`Successfully ${this.edit ? 'renamed' : 'added new'} site`, '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe()   
  }

  editSite(id: string, name: string) {
    this.edit = id;
    this.siteForm.patchValue({site: name});
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
