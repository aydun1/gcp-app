import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { Customer } from '../../customers/shared/customer';
import { Site } from '../../customers/shared/site';
import { Delivery } from '../shared/delivery';
import { DeliveryService } from '../shared/delivery.service';
import { Order } from '../shared/order';
import { Run } from '../shared/run';
import { SharedService } from '../../shared.service';
import { CustomerPickerDialogComponent } from '../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { PalletDialogComponent } from '../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../../recycling/shared/recycling-dialog/recycling-dialog.component';
import { DeliveryEditorDialogComponent } from '../shared/delivery-editor-dialog/delivery-editor-dialog.component';
import { RunManagerDialogComponent } from '../shared/run-manager-dialog/run-manager-dialog.component';
import { OrderLinesDialogComponent } from '../shared/order-lines-dialog/order-lines-dialog.component';

@Component({
  selector: 'gcp-run-list',
  templateUrl: './run-list.component.html',
  styleUrls: ['./run-list.component.css']
})
export class RunListComponent implements OnInit {
  private _loadList = false;
  private _branch!: string;

  public listSize!: number;
  public runFilter = new FormControl('');
  public dateFilter = new FormControl(this.getDate());
  public orders$!: Observable<Order[]>;
  public deliveries$!: Observable<Delivery[]>;
  public loadingList$ = this.deliveryService.loading;
  public runs: Array<Run> = [];
  public otherRuns: Array<Run> = [{fields: {Title: 'Default'}} as Run];
  public run = '';
  public showFulfilled = false;
  public loading = false;
  public loadingOrders = true;
  public empty = true;
  public displayedColumns = ['sequence', 'customer', 'site', 'notes', 'actions', 'status', 'menu'];
  public locked = false;
  public currentCategory = this.route.snapshot.queryParamMap.get('opened');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private deliveryService: DeliveryService
  ) { }

  private getDate(): Date {
    const date = new Date();
    const day = date.getDay();
    const nextDay = day > 4 ? 8 - day : 1;
    date.setDate(date.getDate() + nextDay);
    date.setHours(0,0,0,0);
    return date;
  }

  nextDay(): void {
    if (!this.dateFilter.value) return;
    const date = this.dateFilter.value;
    date.setDate(date.getDate() + 1);
    date.setHours(0,0,0,0);
    this.dateFilter.setValue(date);
  }

  prevDay(): void {
    if (!this.dateFilter.value) return;
    const date = this.dateFilter.value;
    date.setDate(date.getDate() - 1);
    date.setHours(0,0,0,0);
    this.dateFilter.setValue(date);
  }

  ngOnInit(): void {
    const state$ = this.sharedService.getBranch();
    this.orders$ = this.dateFilter.valueChanges.pipe(
      tap(() => this.loadingOrders = true),
      startWith(this.dateFilter.value),
      switchMap(_ => this.deliveryService.syncOrders('QLD', _ || this.getDate())),
      tap(() => this.loadingOrders = false)
    );
    this.deliveries$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => state$.pipe(
        tap(_ => {
          this._branch = _;
          this.showFulfilled = this._branch === 'QLD';
        }),
        map(state => !_['branch'] ? {..._, branch: state} : _),
      )),
      switchMap(_ => this.deliveryService.getRuns(_['branch']).pipe(
        tap(runs => this.runs = runs),
        tap(runs => this.otherRuns = runs.filter(r => r.fields.Title !== this.runFilter.value)),
        map(() => _)
      )),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this._loadList ? this.getDeliveries(_) : []),
      tap(_ => this.listSize = _.length)
    )
  }

  getDeliveries(params: Params): Observable<Delivery[]> {
    return this.deliveryService.getDeliveries(params['branch']).pipe(
      map(_ => _.filter(d => d.fields.Title === params['run']))
    )
  }

  openReceipt(orderNumber: string): void {
    const data = {
      sopType: 2,
      sopNumber: orderNumber,
    };

    this.dialog.open(OrderLinesDialogComponent, {width: '800px', data, autoFocus: false});
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
    if ('run' in params) {
      this.locked = true;
      this.run = params['run'];
      this.runFilter.patchValue(this.run);
      filters['run'] = this.run;
    } else {
      this.locked = false;
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
    const sameRefresh = prev['refresh'] === curr['refresh'];
    return sameRun && sameRefresh && this._loadList;
  }

  openCustomerPicker(): void {
    const data = {notes: true, address: true, title: 'Delivery details'};
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().pipe(
      switchMap(_ => _ ? this.addCustomerDelivery(_.customer, _.site, _.address, _.notes) : of()),
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

  moveItem(event: CdkDragDrop<Delivery[]>): void {
    const run = this.runFilter.value || '';
    const action = event.previousContainer === event.container ?
      this.deliveryService.moveItem(event.previousIndex, event.currentIndex, run) :
      this.addOrderDelivery(event.item.data as Order, run, event.currentIndex);
    action.subscribe();
  }

  moveToOtherRun(event: {value: Delivery[]}, targetRun: string): void {
    this.loading = true;
    const ids = event.value.map(_ => _.id);
    this.deliveryService.moveDeliveries(ids, this.runFilter.value, targetRun).then(
      _ => {
        this.snackBar.open(`Moved delivery to ${targetRun || 'Default'}`, '', {duration: 3000});
        this.loading = false;
      }
    ).catch(_ => {
      this.snackBar.open('Could not move delivery', '', {duration: 3000});
      this.loading = false;
    });
  }

  addOrderDelivery(order: Order, run: string, index?: number): Observable<Delivery[]> {
    this.loading = true;
    const fullAddress = [order.address1, order.address2, order.address3].filter(_ => _).join('\r\n') + '\r\n' +
    [order.city, order.state, order.postCode].filter(_ => _).join(' ');
    const customer = {name: order.custName, custNmbr: order.custNumber} as Customer;
    const delivery = this.deliveryService.createDropPartial(run, customer, null, fullAddress, '', order);
    return this.deliveryService.addDrop(delivery, index).pipe(
      tap(_ => this.loading = false),
      catchError(_ => {
        this.loading = false;
        this.snackBar.open('Could not add delivery', '', {duration: 3000});
        return [];
      })
    )
  }

  addCustomerDelivery(customer: Customer, site: Site, address: string, notes: string): Observable<Delivery[]> {
    const run = this.runFilter.value;
    const delivery = this.deliveryService.createDropPartial(run, customer, site, address, notes);
    return this.deliveryService.addDrop(delivery, this.listSize);
  }

  markComplete(e: any, deliveries: Array<Delivery>, currentStatus: string): void {
    e.stopPropagation();
    const ids = deliveries.map(_ => _.id);
    this.deliveryService.changeStatuses(ids, currentStatus);
  }

  editDelivery(delivery: Delivery): void {
    const data = {delivery};
    const dialogRef = this.dialog.open(DeliveryEditorDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe();
  }

  deleteDeliveries(deliveries: Array<Delivery>, run: string): void {
    const ids = deliveries.map(_ => _.id);
    this.loading = true;
    this.deliveryService.deleteDeliveries(ids, run).then( _ => {
      this.snackBar.open('Removed delivery', '', {duration: 3000});
      this.loading = false
    }).catch(_ => {
      this.snackBar.open('Could not remove delivery', '', {duration: 3000});
       this.loading = false;
    });
  }

  deleteDeliveriesByRun(runName: string): void {
    this.loading = true;
    this.deliveryService.deleteDeliveriesByRun(runName).then( _ => {
      this.snackBar.open('Removed deliveries', '', {duration: 3000});
      this.loading = false
    }).catch(_ => {
      this.snackBar.open('Could not remove deliveries', '', {duration: 3000});
      this.loading = false;
    });
  }

  openPalletDialog(name: string, custNmbr: string, orderNmbr: string, site: string): void {
    const customer = {name, custNmbr};
    const data = {customer, site, orderNmbr: orderNmbr || ''};
    this.dialog.open(PalletDialogComponent, {width: '600px', data, autoFocus: false});
  }

  openRecyclingDialog(name: string, custNmbr: string, site: string): void {
    const customer = {name, custNmbr};
    const data = {customer, site, branch: this._branch};
    this.dialog.open(RecyclingDialogComponent, {width: '800px', data, autoFocus: false});
  }

  pickRun(run: MatSelectChange): void {
    if (run.value === undefined){
      this.runFilter.patchValue(this.run);
      return;
    };
    this.router.navigate([], { queryParams: {run: run.value || null}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  allowPredicate(item: CdkDrag<number>): boolean {
    return true;
  }

  refresh(runName: string | null): void {
    this.loading = true;
    this.deliveryService.reloadRunDeliveries(runName, this._branch)
    .then(_ => this.loading = false)
    .catch(_ => {
      this.snackBar.open('Could not refresh deliveries', '', {duration: 3000});
      this.loading = false;
    })
  }

  setOpenedDelivery(key: string) {
    this.currentCategory = key;
    this.router.navigate([], {queryParams: {opened: key}, replaceUrl: true, queryParamsHandling: 'merge'});
  }

  setClosedDelivery(key: string): void {
    if (this.currentCategory !== key) return;
    this.router.navigate([], {queryParams: {opened: null}, replaceUrl: true, queryParamsHandling: 'merge'});
  }

  trackByFn(index: number, item: Delivery): string {
    return item.id;
  }

  trackByGroupsFn(index: number, item: any): string {
    return item.key;
  }

}
