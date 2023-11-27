import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

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
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { DocsService } from '../../shared/docs/docs.service';
import { Address } from '../../customers/shared/address';

@Component({
  selector: 'gcp-run-list',
  templateUrl: './run-list.component.html',
  styleUrls: ['./run-list.component.css']
})
export class RunListComponent implements OnInit {
  private _branch!: string;
  private _orderRefreshTrigger$ = new BehaviorSubject<boolean>(true);
  private _firstRuns = ['Pickups', 'Recycling'];
  private _openingAll = false;

  @ViewChild('groupedRuns') public accordion!: MatAccordion;
  public dateFilter = new FormControl(this.getDate());
  public orders$!: Observable<Order[]>;
  public deliveries$!: Observable<Delivery[]>;
  public loadingList$ = this.deliveryService.loading;
  public runs: Array<Run> = [];
  public changedRuns!: boolean;
  public otherRuns: Array<Run> | undefined = [{fields: {Title: 'Default'}} as Run];
  public isVic!: boolean;
  public loading = false;
  public loadingOrders = true;
  public loadingPage = true;
  public empty = true;
  public locked = this.route.snapshot.queryParamMap.get('tab') !== '0';
  public currentCategory = this.route.snapshot.queryParamMap.get('opened');
  public openedTab = this.firstTab();
  public populatedRuns: Set<string> = new Set();

  get runName(): string {
    return this.openedTab ? this.runs[this.openedTab]?.fields['Title'] : '';
  }

  firstTab(): number | null {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    return tab === null ? null : parseInt(tab);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private deliveryService: DeliveryService,
    private docsService: DocsService
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
    const date$ = this.dateFilter.valueChanges.pipe(startWith(this.dateFilter.value));
    const state$ = this.sharedService.getBranch().pipe(
      map(_ => this.route.snapshot.queryParamMap.get('branch')?.toLocaleUpperCase() || _),
      tap(_ => {
        this._branch = _;
        this.isVic = _ === 'VIC';
      })
    );

    this.orders$ = combineLatest([state$, date$, this._orderRefreshTrigger$]).pipe(
      tap(() => this.loadingOrders = true),
      switchMap(([state, date, _]) => this.deliveryService.syncOrders(state, date || this.getDate())),
      tap(() => this.loadingOrders = false)
    );

    this.deliveries$ = this.route.queryParams.pipe(
      switchMap(params => state$.pipe(
        map(branch => {return {...params, branch}})
      )),
      switchMap(_ => this.deliveryService.getRuns(_['branch']).pipe(
        map(runs => {
          const email = this.sharedService.getAccount()?.username?.toLowerCase();
          const sortedRuns = runs ? [{fields: {Title: '', Branch: _['branch'], Owner: ''}} as Run, ...runs.sort((a, b) => this.runSortFn(a, b, email))] : [];
          this.changedRuns = this.runs.map(_ => _.id).toString() !== sortedRuns.map(_ => _.id).toString()
          this.runs = sortedRuns;
          this.otherRuns = runs?.filter(r => r.fields.Title !== this.runName);
          const ownRun = this.runs?.findIndex(_ => _.fields.Owner?.toLocaleLowerCase() === email);
          if ((this.openedTab === null || this.openedTab === -1 || !this.route.snapshot.queryParamMap.get('tab')) && this.runs.length > 0) {
            this.openedTab = ownRun === -1 ? 0 : ownRun;
            this.selectTab(this.openedTab);
          }
          return _;
        })
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.refreshOrders()),
      switchMap(_ => _['tab'] !== undefined ? this.getDeliveries(_) : []),
      tap(_ => this.loadingPage = false)
    )
  }

  runSortFn(a: Run, b: Run, email: string | undefined) {
    const x = +(b.fields.Owner?.toLocaleLowerCase() === email) - +(a.fields.Owner?.toLocaleLowerCase() === email);
    const y = +(this._firstRuns.includes(b.fields.Title)) - +(this._firstRuns.includes(a.fields.Title));
    return x !== 0 ? x : y !== 0 ? y : (b.fields.Title > a.fields.Title ? -1 : 1);
  }

  selectTab(tab: number | null): void {
    if (tab === null) return;
    this.openedTab = tab;
    this.locked = tab !== 0;
    const queryParams: any = {tab};
    this.router.navigate([], {queryParams, replaceUrl: true, queryParamsHandling: 'merge'});
  }

  getDeliveries(params: Params): Observable<Delivery[]> {
    return this.deliveryService.getDeliveries(params['branch']).pipe(
      map(_ => {
        this.populatedRuns = new Set(_.map(d => d.fields.Run || ''));
        return _.filter(d => {
          const run = this.runName || this.runs[this.route.snapshot.queryParamMap.get('tab') || 0]?.fields.Title || '';
          return d.fields.Run === run;
      }).map(
        _ => {
          _['order'] = this.deliveryService.getOrder(2, _.fields.OrderNumber);
          return _
        }
      )
    })
    )
  }

  openReceipt(orderNumber: string): void {
    const data = {
      sopType: 2,
      sopNumber: orderNumber,
    };

    this.dialog.open(OrderLinesDialogComponent, {width: '800px', data, autoFocus: false});
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameRun = prev['run'] === curr['run'];
    const sameRefresh = prev['refresh'] === curr['refresh'];
    const sameTab = prev['tab'] === curr['tab'];
    const runsUnchanged = !this.changedRuns
    this.changedRuns = false;
    return sameTab && sameRun && sameRefresh && runsUnchanged;
  }

  openCustomerPicker(): void {
    const data = {notes: true, address: true, title: 'Delivery details'};
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().pipe(
      switchMap(_ => _ ? this.addCustomerDelivery(_.customer, _.site, _.address, _.notes, _.customerType) : of()),
    ).subscribe(() => {
      this.loading = false;
    });
  }

  openRunManager(): void {
    const data = {notes: true, address: true, runs: this.runs.filter(_ => _.fields.Title !== '')};
    const dialogRef = this.dialog.open(RunManagerDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe((runName: string) => {
      const runIndex = this.runs.findIndex(_ => _.fields.Title === runName);
      this.selectTab(runIndex);
    })
  }

  moveItem(event: CdkDragDrop<Delivery[]>): void {
    const run = this.runName || '';
    const action = event.previousContainer === event.container ?
      this.deliveryService.moveItem(event.previousIndex, event.currentIndex, run) :
      this.addOrderDelivery(event.item.data as Order, run, event.currentIndex);
    action.subscribe();
  }

  moveToOtherRun(event: {value: Delivery[]}, targetRun: string): void {
    this.loading = true;
    const ids = event.value.map(_ => _.id);
    this.deliveryService.moveDeliveries(ids, this.runName, targetRun).then(
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
    const customer = {name: order.custName, custNmbr: order.custNumber} as Customer;
    const delivery = this.deliveryService.createDropPartial(run, customer, null, null, '', 'Debtor', order);
    return this.deliveryService.addDrop(delivery, index).pipe(
      tap(_ => this.loading = false),
      catchError(_ => {
        this.loading = false;
        this.snackBar.open('Could not add delivery', '', {duration: 3000});
        return [];
      })
    )
  }

  addCustomerDelivery(customer: Customer, site: Site, address: Address, notes: string, customerType: string): Observable<Delivery[]> {
    const run = this.runName;
    const delivery = this.deliveryService.createDropPartial(run, customer, site, address, notes, customerType);
    return this.deliveryService.addDrop(delivery, undefined);
  }

  markComplete(e: any, deliveries: Array<Delivery>, currentStatus: string): void {
    e.stopPropagation();
    const ids = deliveries.map(_ => _.id);
    this.deliveryService.changeStatuses(ids, currentStatus);
  }

  editDelivery(delivery: Delivery): void {
    console.log(delivery)
    const data = {delivery};
    this.dialog.open(DeliveryEditorDialogComponent, {width: '600px', data});
  }

  deleteDeliveries(deliveries: Array<Delivery>, runName: string): void {
    const ids = deliveries.map(_ => _.id);
    this.loading = true;
    this.deliveryService.deleteDeliveries(ids, runName).then( _ => {
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

  archiveDeliveriesByRun(runName: string): void {
    const data = {title: 'Archive run', content: ['Are you sure you want to archive these deliveries?']};
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {width: '800px', data});
    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result) return;
      this.loading = true;
      this.deliveryService.archiveDeliveriesByRun(runName).then( _ => {
        this.snackBar.open('Archived deliveries', '', {duration: 3000});
        this.loading = false;
        this._orderRefreshTrigger$.next(true);
      }).catch(_ => {
        this.snackBar.open('Could not archive deliveries', '', {duration: 3000});
        this.loading = false;
      });
    });
  }

  checkAllByRun(runName: string, check: boolean): void {
    this.loading = true;
    this.deliveryService.tickDeliveriesByRun(runName, check).then( _ => {
      this.snackBar.open(check ? 'Deliveries checked' : 'Deliveries unchecked', '', {duration: 3000});
      this.loading = false
    }).catch(_ => {
      this.snackBar.open('Could not update deliveries', '', {duration: 3000});
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

  refreshOrders(): void {
    this._orderRefreshTrigger$.next(true);
  }

  fileChangeEvent(folder: string, custNmbr: string, orderNmbr: string, e: Event): void {
    const subfolder = [custNmbr, orderNmbr].filter(_ => _).join('/');
    this.docsService.fileChangeEvent(folder, subfolder, e);
  }
  
  openAll(): void {
    this._openingAll = true;
    this.accordion.openAll();
    this._openingAll = false;
  }

  setOpenedDelivery(opened: string) {
    if (this._openingAll) return;
    this.currentCategory = opened;
    this.router.navigate([], {queryParams: {opened}, replaceUrl: true, queryParamsHandling: 'merge'});
  }

  setClosedDelivery(key: string | null): void {
    if (this._openingAll) return;
    if (!key || this.currentCategory === key) {
      this.currentCategory = null;
      this.router.navigate([], {queryParams: {opened: null}, replaceUrl: true, queryParamsHandling: 'merge'});
    }
  }

  trackByFn(index: number, item: Delivery): string {
    return item.id;
  }

  trackByGroupsFn(index: number, item: any): string {
    return item.key;
  }

  trackByRunsFn(index: number, item: Run): string {
    return item.fields.Title;
  }
}
