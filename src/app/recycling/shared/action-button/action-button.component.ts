import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject, switchMap, tap } from 'rxjs';

import { RecyclingService } from '../recycling.service';
import { Cage } from '../cage';
import { CustomerPickerDialogComponent } from '../../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { NavigationService } from '../../../navigation.service';
import { SharedService } from '../../../shared.service';
import { CustomersService } from '../../../customers/shared/customers.service';
import { Site } from '../../../customers/shared/site';
import { CustomerSiteDialogComponent } from 'src/app/customers/shared/customer-site-dialog/customer-site-dialog.component';

@Component({
  selector: 'gcp-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css']
})
export class ActionButtonComponent implements OnInit {

  @Input() cage!: Cage;
  @Output() updated = new EventEmitter<boolean>();
  
  private depotsSubject$ = new Subject<string>();
  public loading!: boolean;
  public weightForm!: FormGroup;
  public dialogRef!: MatDialogRef<CustomerPickerDialogComponent, any>;
  public branches!: Array<string>;
  public depots!: Array<Site>;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private sharedService: SharedService,
    private navService: NavigationService,
    private recyclingService: RecyclingService,
    private cutomersService: CustomersService
  ) { }

  ngOnInit(): void {
    this.branches = this.sharedService.branches;
    this.weightForm = this.fb.group({
      weight: ['', Validators.required]
    });

    this.depotsSubject$.pipe(
      switchMap(branch => this.cutomersService.getSites(branch)),
      tap(sites => this.depots = sites),
    ).subscribe();
    this.depotsSubject$.next(this.cage.fields.Branch);
  }

  openSiteDialog(branch: String): void {
    const customer = {accountnumber: this.cage.fields.Branch};
    const data = {customer, sites: this.depots};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshDepots());
  }

  onComplete() {
    this.loading = false;
    this.updated.next(true);
  }

  refreshDepots(branch = ''): void {
    this.depotsSubject$.next(branch || this.cage.fields.Branch);
  }

  markWithCustomer(id: string): void {
    this.loading = true;
    this.recyclingService.deliverToCustomer(id).subscribe(() => this.onComplete());
  }

  markAsCollected(id: string): void {
    this.loading = true;
    this.recyclingService.collectFromCustomer(id).subscribe(() => this.onComplete());
  }

  markWithPolymer(id: string): void {
    this.loading = true;
    this.recyclingService.deliverToPolymer(id).subscribe(() => this.onComplete());
  }

  markWithProcessing(id: string): void {
    this.loading = true;
    this.recyclingService.deliverToProcessing(id).subscribe(() => this.onComplete());
  }

  collectFromProcessing(id: string, assetType: string): void {
    this.loading = true;
    const action = assetType.startsWith('Cage') ? this.recyclingService.collectFromProcessing(id): this.recyclingService.collectAndComplete(id);
    action.subscribe(() => this.onComplete());
  }

  collectFromPolymer(id: string, assetType: string): void {
    this.loading = true;
    const action = assetType.startsWith('Cage') ? this.recyclingService.collectFromPolymer(id): this.recyclingService.collectAndComplete(id);
    action.subscribe(() => this.onComplete());
  }

  markAvailable(id: string, cageNumber: number, branch: string, assetType: string, cageWeight: number): void {
    this.loading = true;
    this.recyclingService.markCageAvailable(id, cageNumber, branch, assetType, cageWeight).subscribe(_ => {
      if (this.router.url.startsWith('/recycling')) this.router.navigate(['recycling/cages', _[1]['id']], {replaceUrl: true});
      this.onComplete();
    });
  }

  dehire(id: string): void {
    this.loading = true;
    this.recyclingService.dehireCage(id).subscribe(_ => {
      this.navService.back();
      this.loading = false;
    });
  }

  setBranch(id: string, branch: string) {
    this.loading = true;
    this.recyclingService.setBranch(id, branch).subscribe(() => {
      this.onComplete();
      this.refreshDepots(branch);
    });
  }

  setDepot(id: string, depot: string) {
    this.loading = true;
    this.recyclingService.setDepot(id, depot).subscribe(() => this.onComplete());
  }

  openCustomerPicker(id: string): void {
    this.loading = true;
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px'});
    dialogRef.afterClosed().pipe(
      switchMap(_ => _ ? this.recyclingService.allocateToCustomer(id, _.customer.accountnumber, _.customer.name, _.site) : of(1)),
    ).subscribe(() => this.onComplete());
  }

  saveWeight(id: string): void {
    this.loading = true;
    if (this.weightForm.invalid) return;
    const netWeight = this.weightForm.value.weight - this.cage.fields.CageWeight;
    this.recyclingService.setGrossWeight(id, netWeight).subscribe(() => this.onComplete());
  }

  undo(id: string, status: string): void {
    console.log(id, status)
    this.loading = true;
    this.recyclingService.undo(id, status).subscribe(_ => this.onComplete());
  }

  reset(id: string): void {
    this.loading = true;
    this.recyclingService.resetCage(id).subscribe(_ => this.onComplete());
  }
}
