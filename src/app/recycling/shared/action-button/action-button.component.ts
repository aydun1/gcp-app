import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { concatMap, forkJoin, of, Subject, switchMap, take, tap } from 'rxjs';

import { RecyclingService } from '../recycling.service';
import { Cage } from '../cage';
import { CustomerPickerDialogComponent } from '../../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { SharedService } from '../../../shared.service';
import { CustomersService } from '../../../customers/shared/customers.service';
import { Site } from '../../../customers/shared/site';
import { CustomerSiteDialogComponent } from '../../../customers/shared/customer-site-dialog/customer-site-dialog.component';
import { RunPickerDialogComponent } from '../../../runs/shared/run-picker-dialog/run-picker-dialog.component';
import { DeliveryService } from '../../../runs/shared/delivery.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { CageEditDialogComponent } from '../cage-edit-dialog/cage-edit-dialog.component';

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
  private _depotsSubject$ = new Subject<string>();
  private _branch!: string;

  @Output() updated = new EventEmitter<boolean>();
  @Output() loading = new EventEmitter<boolean>();
  @Output() dehired = new EventEmitter<boolean>();
  @Output() completed = new EventEmitter<boolean>();


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

  get areCages(): boolean {
    const statuses = this.cages.filter(_ => !_.fields.CageNumber);
    return statuses.length === 0;
  }

  get cageBranch(): string | undefined {
    const statuses = new Set(this.cages.map(_ => _?.fields.Branch));
    const [first] = statuses;
    return statuses.size === 1 ? first : undefined;
  }

  get cageMaterial(): number | null {
    const statuses = new Set(this.cages.map(_ => _?.fields.Material));
    const [first] = statuses;
    return statuses.size === 1 ? first : null;
  }

  public dialogRef!: MatDialogRef<CustomerPickerDialogComponent, any>;
  public branches = this.sharedService.branches;
  public materials = this.recyclingService.materials;
  public depots!: Array<Site>;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private recyclingService: RecyclingService,
    private cutomersService: CustomersService,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this._depotsSubject$.pipe(
      switchMap(branch => this.cutomersService.getSites(branch)),
      tap(sites => this.depots = sites),
    ).subscribe();
    this.sharedService.getBranch().subscribe(_ => {
      this._branch = _;
      this._depotsSubject$.next(_);
    });
  }

  openSiteDialog(): void {
    const customer = {custNmbr: this._branch};
    const data = {customer, sites: this.depots};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshDepots());
  }

  onComplete() {
    this.updated.next(true);
  }

  refreshDepots(): void {
    this._depotsSubject$.next(this._branch);
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

  consolidateMaterial(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => {
      const quantity = _.fields.GrossWeight - (_.fields.CageWeight || 0);
      return this.recyclingService.consolidateMaterial(_.id, _.fields.Branch, _.fields.Material, quantity);
    });
    of(...tasks).pipe(
      concatMap(r => r)
    ).subscribe(() => this.onComplete());
  }

  markWithPolymer(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.deliverToPolymer(_.id));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  markReadyForProcessing(cages: Array<Cage>): void {
    this.pickRun().afterClosed().pipe(
      switchMap(run => {
        if (!run) return of(1);
        const chunks = cages.reduce((acc, cur) => {
          const key = `${cur.fields.CustomerNumber}_${cur.fields.Site}`;
          const curVal = acc[key] ? acc[key]['message'] : [];
          const newVal = curVal.concat(`Cage ${cur.fields.CageNumber} ready for delivery to local processing`);
          return {...acc, [key]: {message: newVal, site: cur.fields.Site, customerNumber: cur.fields.CustomerNumber}};
        }, {} as any);
        const tasks = Object.keys(chunks).map(_ => this.deliveryService.requestCageTransfer(run, chunks[_].customerNumber, chunks[_].Site, chunks[_].message.join('<br>')).pipe(take(1)))
        return forkJoin(tasks);
      })
    ).subscribe();

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
    const tasks = cages.map(_ => _.fields.AssetType.startsWith('Cage') ? this.recyclingService.collectFromProcessing(_.id): this.recyclingService.collectAndComplete(_.id, 'polymer'));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  collectFromPolymer(cages: Array<Cage>): void {
    this.loading.next(true);
    const tasks = cages.map(_ => _.fields.AssetType.startsWith('Cage') ? this.recyclingService.collectFromPolymer(_.id): this.recyclingService.collectAndComplete(_.id, 'local'));
    forkJoin(tasks).subscribe(() => this.onComplete());
  }

  markReadyForPolymer(cages: Array<Cage>): void {
    const customerNumber = '011866';
    this.pickRun().afterClosed().pipe(
      switchMap(run => {
        if (!run) return of(1);
        const chunks = cages.reduce((acc, cur) => {
          const key = `${customerNumber}_${cur.fields.Site}`;
          const curVal = acc[key] ? acc[key]['message'] : [];
          const newVal = curVal.concat(`Cage ${cur.fields.CageNumber} ready for delivery to Polymer`);
          return {...acc, [key]: {message: newVal, site: cur.fields.Site, customerNumber}};
        }, {} as any);
        const tasks = Object.keys(chunks).map(_ => this.deliveryService.requestCageTransfer(run, chunks[_].customerNumber, chunks[_].Site, chunks[_].message.join('<br>')).pipe(take(1)));
        return forkJoin(tasks);
      })
    ).subscribe();

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

  setBranch(cages: Array<Cage>, branch: string): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.setBranch(_.id, branch));
    forkJoin(tasks).subscribe(() => {
      this.onComplete();
      this.refreshDepots();
    });
  }

  openEditDialog(cages: Array<Cage>): void {
    const data = {cages: cages};
    const dialogRef = this.dialog.open(CageEditDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(() => this.onComplete());
  }

  setMaterial(cages: Array<Cage>, material: {code: number}): void {
    this.loading.next(true);
    const tasks = cages.map(_ => this.recyclingService.setMaterial(_.id, material['code']));
    forkJoin(tasks).subscribe(() => {
      this.onComplete();
      this.refreshDepots();
    });
  }

  setDepot(cages: Array<Cage>, depot: string): void {
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
        const tasks = cages.map(cage => this.recyclingService.allocateToCustomer(cage.id, _.customer.custNmbr, _.customer.name, _.site).pipe(take(1)));
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
    const data = {title: 'Reset cage', content: ['Are you sure you want to reset this cage?', 'This will clear the current status and customer and set it back to available.']};
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {width: '800px', data});
    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result) return;
      this.loading.next(true);
      const tasks = cages.map(cage => this.recyclingService.resetCage(cage.id));
      forkJoin(tasks).subscribe(_ => this.onComplete());
    });
  }

  readyForCollection(cages: Array<Cage>): void {
    this.pickRun().afterClosed().pipe(
      tap(() => this.loading.next(true)),
      switchMap(run => {
        if (!run) return of(1);
        const tasks = cages.map(_ => this.deliveryService.requestCageTransfer(run, _.fields.CustomerNumber || '', _.fields.Site || '', `Cage ${_.fields.CageNumber ? _.fields.CageNumber + ' ' : ''}ready for collection`).pipe(take(1)));
        return forkJoin(tasks);
      })
    ).subscribe(() => this.onComplete());
  }

  pickRun(): MatDialogRef<RunPickerDialogComponent, any> {
    return this.dialog.open(RunPickerDialogComponent, {width: '600px', autoFocus: false});
  }
}
