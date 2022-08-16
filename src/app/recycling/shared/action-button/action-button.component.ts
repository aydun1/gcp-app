import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { forkJoin, of, Subject, switchMap, take, tap } from 'rxjs';

import { RecyclingService } from '../recycling.service';
import { Cage } from '../cage';
import { CustomerPickerDialogComponent } from '../../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { SharedService } from '../../../shared.service';
import { CustomersService } from '../../../customers/shared/customers.service';
import { Site } from '../../../customers/shared/site';
import { CustomerSiteDialogComponent } from '../../../customers/shared/customer-site-dialog/customer-site-dialog.component';
import { RunPickerDialogComponent } from '../../../runs/shared/run-picker-dialog/run-picker-dialog.component';
import { DeliveryService } from '../../../runs/shared/delivery.service';

@Component({
  selector: 'gcp-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css']
})
export class ActionButtonComponent implements OnInit {

  @Input()
  get cages(): Array<Cage> { return this._cages; }
  set cages(value: Array<Cage>) {
    this._cages = value;
    this.loading.next(false);
  }
  private _cages!: Array<Cage>;

  @Output() updated = new EventEmitter<boolean>();
  @Output() loading = new EventEmitter<boolean>();
  @Output() dehired = new EventEmitter<boolean>();
  @Output() completed = new EventEmitter<boolean>();

  private depotsSubject$ = new Subject<string>();

  get statusId(): number | undefined {
    const statuses = new Set(this.cages.map(_ => _.statusId));
    const [first] = statuses;
    return statuses.size === 1 ? first : undefined;
  }

  get hasComplete(): boolean | undefined {
    return this.cages.filter(_ => _.statusId === 7).length > 0;
  }

  get status(): string | undefined {
    const statuses = new Set(this.cages.map(_ => _?.fields.Status));
    const [first] = statuses;
    return statuses.size === 1 ? first : undefined;
  }

  get cageBranch(): string | undefined {
    const statuses = new Set(this.cages.map(_ => _?.fields.Branch));
    const [first] = statuses;
    return statuses.size === 1 ? first : undefined;
  }

  public dialogRef!: MatDialogRef<CustomerPickerDialogComponent, any>;
  public branches!: Array<string>;
  public depots!: Array<Site>;
  public branch!: string;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private sharedService: SharedService,
    private recyclingService: RecyclingService,
    private cutomersService: CustomersService,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.branches = this.sharedService.branches;
    this.depotsSubject$.pipe(
      switchMap(branch => this.cutomersService.getSites(branch)),
      tap(sites => this.depots = sites),
    ).subscribe();
    this.sharedService.getBranch().subscribe(_ => {
      this.branch = _;
      this.depotsSubject$.next(_);
    });
  }

  openSiteDialog(): void {
    const customer = {accountnumber: this.branch};
    const data = {customer, sites: this.depots};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshDepots());
  }

  onComplete() {
    this.updated.next(true);
  }

  refreshDepots(): void {
    this.depotsSubject$.next(this.branch);
  }

  markWithCustomer(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.deliverToCustomer(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  markAsCollected(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.collectFromCustomer(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  markWithPolymer(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.deliverToPolymer(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  markReadyForProcessing(cages: Array<Cage>): void {
    this.pickRun().afterClosed().pipe(
      tap(() => this.loading.next(true)),
      switchMap(run => {
        if (!run) return of(1);
        const tasks = cages.map(_ => this.deliveryService.requestCageTransfer(run, _.fields.CustomerNumber, _.fields.Site, `Cage ${_.fields.CageNumber} ready for delivery to local processing`).pipe(take(1)));
        return forkJoin(tasks);
      })
    ).subscribe(() => this.onComplete());
    const tasks = cages.map(_ => this.recyclingService.readyForProcessing(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  markWithProcessing(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.deliverToProcessing(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  collectFromProcessing(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => _.fields.AssetType.startsWith('Cage') ? this.recyclingService.collectFromProcessing(_.id): this.recyclingService.collectAndComplete(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  collectFromPolymer(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => _.fields.AssetType.startsWith('Cage') ? this.recyclingService.collectFromPolymer(_.id): this.recyclingService.collectAndComplete(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }





  markReadyForPolymer(cages: Array<Cage>): void {
    const customerNumber = '011866';
    this.pickRun().afterClosed().pipe(
      tap(() => this.loading.next(true)),
      switchMap(run => {
        if (!run) return of(1);
        const tasks = cages.map(_ => this.deliveryService.requestCageTransfer(run, customerNumber, _.fields.Site, `Cage ${_.fields.CageNumber} ready for delivery to Polymer`).pipe(take(1)));
        return forkJoin(tasks);
      })
    ).subscribe(() => this.onComplete());
    const tasks = cages.map(_ => this.recyclingService.readyForPolymer(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  markAvailable(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.markCageAvailable(_.id, _.fields.CageNumber, _.fields.Branch, _.fields.AssetType, _.fields.CageWeight));
    forkJoin(tasks).subscribe(_ => {
      if (this.router.url === `/recycling/${_[0][0]['id']}`) this.router.navigate(['recycling/cages', _[0][1]['id']], {replaceUrl: true});
      this.onComplete();
    });
  }

  dehire(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.dehireCage(_.id));
    forkJoin(tasks).subscribe(_ => {
      this.dehired.next(true);
      this.loading.next(false);
      this.onComplete();
    });
  }

  setBranch(cages: Array<Cage>, branch: string) {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.setBranch(_.id, branch));
    forkJoin(tasks).subscribe(() => {
      this.onComplete();
      this.refreshDepots();
    });
  }

  setDepot(cages: Array<Cage>, depot: string) {
    this.loading.next(true);
    const tasks = cages.map(cage => this.recyclingService.setDepot(cage.id, depot));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  openCustomerPicker(cages: Array<Cage>): void {
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px'});
    dialogRef.afterClosed().pipe(
      tap(() => this.loading.next(true)),
      switchMap(_ => {
        if (!_) return of(1);
        const tasks = cages.map(cage => this.recyclingService.allocateToCustomer(cage.id, _.customer.accountnumber, _.customer.name, _.site).pipe(take(1)));
        return forkJoin(tasks);
      })
    ).subscribe(() => this.onComplete());
  }

  undo(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(cage => this.recyclingService.undo(cage.id, cage.fields.Status));
    forkJoin(tasks).subscribe(_ => this.onComplete());
  }

  reset(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(cage => this.recyclingService.resetCage(cage.id));
    forkJoin(tasks).subscribe(_ => this.onComplete());
  }

  readyForCollection(cages: Array<Cage>): void {
    this.pickRun().afterClosed().pipe(
      tap(() => this.loading.next(true)),
      switchMap(run => {
        if (!run) return of(1);
        const tasks = cages.map(_ => this.deliveryService.requestCageTransfer(run, _.fields.CustomerNumber, _.fields.Site, `Cage ${_.fields.CageNumber ? _.fields.CageNumber + ' ' : ''}ready for collection`).pipe(take(1)));
        return forkJoin(tasks);
      })
    ).subscribe(() => this.onComplete());
  }

  pickRun(): MatDialogRef<RunPickerDialogComponent, any> {
    return this.dialog.open(RunPickerDialogComponent, {width: '600px', autoFocus: false});
  }
}
