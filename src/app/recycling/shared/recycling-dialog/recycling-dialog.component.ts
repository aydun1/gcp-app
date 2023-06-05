import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';

import { SharedService } from '../../../shared.service';
import { RecyclingService } from '../../shared/recycling.service';
import { Cage } from '../../shared/cage';
import { Customer } from '../../../customers/shared/customer';
import { Site } from '../../../customers/shared/site';

interface AllocatorForm {
  site: FormControl<string | null>;
}

@Component({
  selector: 'gcp-recycling-dialog',
  templateUrl: './recycling-dialog.component.html',
  styleUrls: ['./recycling-dialog.component.css']
})
export class RecyclingDialogComponent implements OnInit {
  readonly allocated = 1;
  readonly delivered = 2;
  readonly returned = 3;
  public others = ['Bulka Bag', 'Pallet', 'Other'];
  public noAllocatedCages$ = new BehaviorSubject<boolean>(false);
  public noDeliveredCages$ = new BehaviorSubject<boolean>(false);
  public noReturnedCages$ = new BehaviorSubject<boolean>(false);
  public cages$ = new BehaviorSubject<Cage[]>([]);
  public allocatorForm!: FormGroup<AllocatorForm>;
  public assigning!: boolean;
  public availableCages$!: Observable<Cage[]>;
  public loadingCages$ = new BehaviorSubject<boolean>(true);
  public loadingAvailableCages$ = new BehaviorSubject<boolean>(true);
  public sites!: Array<string>;
  public site!: string | undefined;
  public get branches(): Array<string> {return this.shared.branches};

  constructor(
      public dialogRef: MatDialogRef<RecyclingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string, branch: string},
      private router: Router,
      private shared: SharedService,
      private recyclingService: RecyclingService,
      private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const requireSite = this.data.site || this.data.sites?.length > 0;
    this.site = this.data.site;
    this.sites = this.data.sites ? this.data.sites.map(_ => _.fields.Title) : [this.site].filter(_ => _);
    this.allocatorForm = this.fb.group({
      site: new FormControl(this.site, requireSite ? [Validators.required] : [])
    });
    this.getCagesWithCustomer();
    this.getAvailableCages(false);
  }

  getCagesWithCustomer(): void {
    this.loadingCages$.next(true);
    this.recyclingService.getActiveCustomerCages(this.data.customer.custNmbr, this.site, true).pipe(
      map(_ => _.map(c => {
        return {...c, logo: this.recyclingService.materials.find(m => m['code'] === c.fields.Material)?.image}
      }))
    ).subscribe(
      _ => {
        this.noAllocatedCages$.next(_.filter(c => c['statusId'] === this.allocated).length === 0);
        this.noDeliveredCages$.next(_.filter(c => c['statusId'] === this.delivered).length === 0);
        this.noReturnedCages$.next(_.filter(c => c['statusId'] && c['statusId'] >= this.returned).length === 0);
        this.cages$.next(_);
        this.loadingCages$.next(false);
      }
    );
  }

  createAndAssignToCustomer(containerType: string): void {
    if (this.allocatorForm.invalid) return;
    const site = this.allocatorForm.value.site;
    this.recyclingService.addNewCage(undefined, this.data.branch, containerType, undefined).pipe(
      switchMap(_ => this.recyclingService.allocateToCustomer(_.id, this.data.customer.custNmbr, this.data.customer.name, site))
    ).subscribe(() => this.closeAssigningPage());
  }

  assignToCustomer(id: string): void {
    if (this.allocatorForm.invalid) return;
    const site = this.allocatorForm.value.site;
    this.recyclingService.allocateToCustomer(id, this.data.customer.custNmbr, this.data.customer.name, site).subscribe(() => this.closeAssigningPage());
  }

  getAvailableCages(all: boolean): void {
    this.loadingAvailableCages$.next(true);
    this.availableCages$ = this.recyclingService.getAvailableCages(all ? '' : this.data.branch).pipe(
      tap(_ => this.loadingAvailableCages$.next(false))
    );
  }

  openAssigningPage(): void {
    this.assigning = true;
    this.noAllocatedCages$.next(false);
    this.noDeliveredCages$.next(false);
    this.noReturnedCages$.next(false);
  }

  closeAssigningPage(): void {
    this.assigning = false;
    this.loadingAvailableCages$.next(true);
    this.getCagesWithCustomer();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  setSite(site: string): void {
    this.site = site;
    this.getCagesWithCustomer();
    this.allocatorForm.patchValue({site});
    if(this.data.sites) this.router.navigate([], { queryParams: {site: this.site}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByIndex(index: number, item: Cage[]): number {
    return index;
  }

  trackByFn(index: number, item: Cage): string {
    return item.id;
  }
}
