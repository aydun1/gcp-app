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
  public siteId: string;
  public oldName: string;

  constructor(
    private dialogRef: MatDialogRef<CustomerSiteDialogComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private customerService: CustomersService,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>}
  ) { }

  ngOnInit(): void {
    this.siteForm = this.fb.group({
      site: ['', [Validators.required, this.customerService.uniqueSiteValidator(this.data.sites)]]
    });
  }

  openEditor(siteId: string, name: string): void {
    this.siteId = siteId;
    this.oldName = name;
    this.siteForm.patchValue({site: name});
  }

  addSite(): void {
    if (this.siteForm.invalid) return;
    const action = this.customerService.addSite(this.data.customer, this.siteForm.value['site']);
    this.finaliseAction(action, 'added new').subscribe();
  }

  renameSite() {
    if (this.siteForm.invalid) return;
    const newName = this.siteForm.value['site'];
    const action = this.customerService.renameSite(this.data.customer, this.siteId, newName, this.oldName);
    this.finaliseAction(action, 'renamed').subscribe();
  }

  deleteSite() {
    const action = this.customerService.deleteSite(this.data.customer, this.siteId, this.oldName);
    this.finaliseAction(action, 'removed').subscribe();
  }

  private finaliseAction(action: Observable<Object>, word: string) {
    this.loading = true;
    return action.pipe(
      tap(_ => {
        this.dialogRef.close();
        this.snackBar.open(`Successfully ${word} site`, '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    )
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
