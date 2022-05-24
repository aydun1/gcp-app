import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { Customer } from '../../customers/shared/customer';
import { CustomerPickerDialogComponent } from '../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { Site } from '../../customers/shared/site';
import { PalletDialogComponent } from '../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../../recycling/shared/recycling-dialog/recycling-dialog.component';
import { SharedService } from '../../shared.service';
import { Delivery } from '../shared/delivery';
import { DeliveryService } from '../shared/delivery.service';

@Component({
  selector: 'gcp-run-list',
  templateUrl: './run-list.component.html',
  styleUrls: ['./run-list.component.css']
})
export class RunListComponent implements OnInit {
  private _loadList: boolean;
  private listSize: number;

  public deliveries$: Observable<Delivery[]>;
  public loadingList$ = this.deliveryService.loading;
  public loading: false;
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
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => state$.pipe(map(state => !_['branch'] ? {..._, branch: state} : _))),
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
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    return true && this._loadList;
  }

  openCustomerPicker(): void {
    const data = {notes: true};
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().pipe(
      switchMap(_ => _ ? this.addDelivery(_.customer, _.site, _.notes) : of()),
    ).subscribe(() => {
      this.loading = false;
    });
  }

  moveItem(event: CdkDragDrop<Delivery[]>) {
    this.dragDisabled = true;
    return this.deliveryService.moveItem(event.previousIndex, event.currentIndex).pipe(
      tap(a => this.listSize = a.length)
    ).subscribe()
  }

  addDelivery(customer: Customer, site: Site, notes: string) {
    return this.deliveryService.createDelivery('runname', customer, site, notes, this.listSize + 1);
  }

  markComplete(id: string, currentStatus: string) {
    return this.deliveryService.changeStatus(id, currentStatus).subscribe();
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

}
