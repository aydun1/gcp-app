import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { Customer } from 'src/app/customers/shared/customer';
import { CustomerPickerDialogComponent } from 'src/app/customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { Site } from 'src/app/customers/shared/site';
import { PalletDialogComponent } from 'src/app/pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from 'src/app/recycling/shared/recycling-dialog/recycling-dialog.component';
import { SharedService } from 'src/app/shared.service';
import { Delivery } from '../shared/delivery';
import { DeliveryService } from '../shared/delivery.service';

@Component({
  selector: 'gcp-run-list',
  templateUrl: './run-list.component.html',
  styleUrls: ['./run-list.component.css']
})
export class RunListComponent implements OnInit {
  private _deliveriesSubject = new BehaviorSubject<Delivery[]>([]);
  private _loadList: boolean;
  public deliveries$: Observable<Delivery[]>;
  public deliveries: Delivery[];
  public loadingList$ = this.deliveryService.loading;
  public loading: false;
  public displayedColumns = ['sequence', 'customer', 'site', 'actions'];
  public listSize: number;
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
      tap(_ => {
        this.parseParams(_);
      }),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(_ => this._deliveriesSubject.next(_)),
      tap(_ => this.listSize = _.length),
      switchMap(_ => this._deliveriesSubject)
    )

  }

  getFirstPage(params: Params): Observable<Delivery[]> {
    return this.deliveryService.getFirstPage(params).pipe(
      map(_=>
        _.map(pallet =>  {
          pallet.fields['To'] = '';
          return pallet;
        })
      )
    );
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
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px'});
    dialogRef.afterClosed().pipe(
      switchMap(_ => _ ? this.addDelivery(_.customer, _.site) : of()),
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

  addDelivery(customer: Customer, site: Site) {
    return this.deliveryService.createDelivery('runname', customer, site, this.listSize + 1);
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
