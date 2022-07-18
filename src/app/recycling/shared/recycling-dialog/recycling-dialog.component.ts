import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { RecyclingService } from '../../shared/recycling.service';
import { Cage } from '../../shared/cage';
import { Customer } from '../../../customers/shared/customer';
import { Site } from '../../../customers/shared/site';

@Component({
  selector: 'gcp-recycling-dialog',
  templateUrl: './recycling-dialog.component.html',
  styleUrls: ['./recycling-dialog.component.css']
})
export class RecyclingDialogComponent implements OnInit {
  public noAllocatedCages$ = new BehaviorSubject<boolean>(false);
  public noDeliveredCages$ = new BehaviorSubject<boolean>(false);
  public noCageHistory$ = new BehaviorSubject<boolean>(false);
  public cages$ = new BehaviorSubject<Cage[]>([]);
  public weightForm!: FormGroup;
  public allocatorForm!: FormGroup;
  public assigning!: boolean;
  public availableCages$!: Observable<Cage[]>;
  public loadingCages$ = new BehaviorSubject<boolean>(true);
  public loadingAvailableCages$ = new BehaviorSubject<boolean>(true);
  public siteNames!: Array<string>;

  constructor(
      public dialogRef: MatDialogRef<RecyclingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string, branch: string},
      private recyclingService: RecyclingService,
      private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const requireSite = this.data.site || this.data.sites?.length;
    this.siteNames = this.data.sites ? this.data.sites.map(_ => _.fields.Title) : [this.data.site].filter(_ => _);
    this.allocatorForm = this.fb.group({
      site: [this.data.site, requireSite ? Validators.required : '']
    });
    this.weightForm = this.fb.group({
      weight: ['', Validators.required]
    });
    this.getContainers();
    this.availableCages$ = this.recyclingService.getAvailableCages(this.data.branch).pipe(
      tap(_ => this.loadingAvailableCages$.next(false))
    );
  }

  getContainers(): void {
    this.loadingCages$.next(true);
    this.recyclingService.getActiveCagesWithCustomer(this.data.customer.accountnumber, this.data.site).subscribe(
      _ => {
        this.noAllocatedCages$.next(_.filter(c => c['fields']['Status'] === 'Allocated to customer').length === 0);
        this.noDeliveredCages$.next(_.filter(c => c['fields']['Status'] !== 'Allocated to customer').length === 0);
        this.cages$.next(_);
        this.loadingCages$.next(false);
      }
    );
  }

  assignToCustomer(id: string): void {
    if (this.allocatorForm.invalid) return;
    const site = this.allocatorForm.value.site;
    this.recyclingService.allocateToCustomer(id, this.data.customer.accountnumber, this.data.customer.name, site).subscribe(() => this.closeAssigningPage());
  }

  openAssigningPage(): void {
    this.assigning = true;
    this.noAllocatedCages$.next(false);
    this.noDeliveredCages$.next(false);
    this.noCageHistory$.next(false);
  }

  closeAssigningPage(): void {
    this.assigning = false;
    this.loadingAvailableCages$.next(true);
    this.getContainers();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  trackByIndex(index: number, item: Cage): number {
    return index;
  }

  trackByFn(index: number, item: Cage): string {
    return item.id;
  }
}
