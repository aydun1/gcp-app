import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
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
  public siteForm!: FormGroup;
  public loading = false;
  public siteId!: string;
  public oldName!: string;

  constructor(
    private dialogRef: MatDialogRef<CustomerSiteDialogComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private customerService: CustomersService,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>}
  ) { }

  ngOnInit(): void {
    this.siteForm = this.fb.group({
      site: ['', [Validators.required, this.customerService.uniqueSiteValidator(this.data.sites)]],
      address: ['']
    });
  }

  openEditor(siteId: string, name: string, address: string): void {
    this.siteId = siteId;
    this.oldName = name;
    this.siteForm = this.fb.group({
      site: [name, [Validators.required, this.customerService.uniqueSiteValidator(this.data.sites.filter(_ => _.fields.Title !== this.oldName))]],
      address: [address]
    });
  }

  addSite(): void {
    if (this.siteForm.invalid) return;
    const newName = this.siteForm.value['site'];
    const newAddress = this.siteForm.value['address'];
    const action = this.customerService.addSite(this.data.customer, newName, newAddress);
    this.finaliseAction(action, 'added new').subscribe(() => this.navigate(newName));
  }

  renameSite(): void {
    if (this.siteForm.invalid) return;
    const newName = this.siteForm.value['site'];
    const newAddress = this.siteForm.value['address'];
    const action = this.customerService.renameSite(this.data.customer, this.siteId, newName, this.oldName, newAddress);
    this.finaliseAction(action, 'edited').subscribe(() => this.navigate(newName));
  }

  deleteSite(): void {
    const action = this.customerService.deleteSite(this.data.customer, this.siteId, this.oldName);
    this.finaliseAction(action, 'removed').subscribe(() => this.navigate(null));
  }

  private finaliseAction(action: Observable<Object>, word: string): Observable<object> {
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

  navigate(site: string | null): void {
    this.router.navigate([], { queryParams: {site}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
