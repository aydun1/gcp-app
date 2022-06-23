import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { Customer } from '../../customers/shared/customer';
import { CustomerPickerDialogComponent } from '../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { Site } from '../../customers/shared/site';
import { PalletDialogComponent } from '../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../../recycling/shared/recycling-dialog/recycling-dialog.component';
import { SharedService } from '../../shared.service';
import { Delivery } from '../shared/delivery';
import { DeliveryEditorDialogComponent } from '../shared/delivery-editor-dialog/delivery-editor-dialog.component';
import { DeliveryService } from '../shared/delivery.service';
import { Run } from '../shared/run';
import { RunManagerDialogComponent } from '../shared/run-manager-dialog/run-manager-dialog.component';

@Component({
  selector: 'gcp-run-list',
  templateUrl: './run-list.component.html',
  styleUrls: ['./run-list.component.css']
})
export class RunListComponent implements OnInit {
  private _loadList = false;
  public listSize!: number;
  public runFilter = new FormControl('');

  public deliveries$!: Observable<Delivery[]>;
  public loadingList$ = this.deliveryService.loading;
  public runs: Array<Run> = [];
  public run = '';
  public loading = false;
  public empty = true;
  public displayedColumns = ['sequence', 'customer', 'site', 'notes', 'actions', 'status', 'menu'];
  public dragDisabled = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    const state$ = this.sharedService.getBranch();

    this.deliveries$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => state$.pipe(
        map(state => !_['branch'] ? {..._, branch: state} : _),
      )),
      switchMap(_ => this.deliveryService.getRuns(_['branch']).pipe(
        tap(runs => this.runs = runs),
        map(() => _)
      )),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(_ => this.listSize = _.length),
    )
  }

  getFirstPage(params: Params): Observable<Delivery[]> {
    return this.deliveryService.getFirstPage(params);
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
    if ('run' in params) {
      this.run = params['run'];
      this.runFilter.patchValue(this.run);
      filters['run'] = this.run;
    } else {
      this.run = '';
      this.runFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameRun = prev['run'] === curr['run'];
    return sameRun && this._loadList;
  }

  openCustomerPicker(): void {
    const data = {notes: true, address: true, title: 'Delivery details'};
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().pipe(
      switchMap(_ => _ ? this.addDelivery(_.customer, _.site, _.address, _.notes) : of()),
    ).subscribe(() => {
      this.loading = false;
    });
  }

  openRunManager(): void {
    const data = {notes: true, address: true, runs: this.runs};
    const dialogRef = this.dialog.open(RunManagerDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().pipe(
    ).subscribe()
  }

  moveItem(event: CdkDragDrop<Delivery[]>) {
    this.dragDisabled = true;
    return this.deliveryService.moveItem(event.previousIndex, event.currentIndex).pipe(
      tap(a => this.listSize = a.length)
    ).subscribe()
  }

  addDelivery(customer: Customer, site: Site, address: string, notes: string) {
    const run = this.runFilter.value || '';
    return this.deliveryService.createDelivery(run, customer, site, address, notes, this.listSize + 1);
  }

  markComplete(id: string, currentStatus: string) {
    return this.deliveryService.changeStatus(id, currentStatus).subscribe();
  }

  editDelivery(delivery: Delivery) {
    const data = {delivery};
    const dialogRef = this.dialog.open(DeliveryEditorDialogComponent, {width: '600px', data});
    return dialogRef.afterClosed().subscribe();
  }

  deleteDelivery(id: string) {
    return this.deliveryService.deleteDelivery(id).subscribe();
  }

  trackByFn(index: number, item: Delivery): string {
    return item.id;
  }

  openPalletDialog(name: string, accountnumber: string, site: string): void {
    const customer = {name, accountnumber};
    const data = {customer, site};
    this.dialog.open(PalletDialogComponent, {width: '600px', data, autoFocus: false});
  }

  openRecyclingDialog(name: string, accountnumber: string, site: string): void {
    const customer = {name, accountnumber};
    const data = {customer, site};
    this.dialog.open(RecyclingDialogComponent, {width: '800px', data, autoFocus: false});
  }

  pickRun(run: MatSelectChange): void {
    if (run.value === undefined){
      this.runFilter.patchValue(this.run);
      return;
    };
    this.router.navigate([], { queryParams: {run: run.value || null}, queryParamsHandling: 'merge', replaceUrl: true});
  }
}
