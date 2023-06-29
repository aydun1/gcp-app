import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { Delivery } from '../shared/delivery';
import { Order } from '../shared/order';
import { Run } from '../shared/run';
import { SharedService } from '../../shared.service';
import { OrderLinesDialogComponent } from '../shared/order-lines-dialog/order-lines-dialog.component';
import { DeliveryCompletedService } from '../shared/delivery-completed.service';

@Component({
  selector: 'gcp-run-list-completed',
  templateUrl: './run-list-completed.component.html',
  styleUrls: ['./run-list-completed.component.css']
})
export class RunListCompletedComponent implements OnInit {
  private _loadList = false;
  private _branch!: string;
  private _orderRefreshTrigger$ = new Subject<boolean>();

  public dateFilter = new FormControl(this.getDate());
  public orders$!: Observable<Order[]>;
  public deliveries$!: Observable<Delivery[]>;
  public loadingList$ = this.deliveryCompletedService.loading;
  public runs: Array<Run> = [];
  public loading = false;
  public loadingPage = true;
  public empty = true;
  public displayedColumns = ['date', 'run', 'order', 'customer'];
  public runName!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private deliveryCompletedService: DeliveryCompletedService,
  ) { }

  private getDate(): Date {
    const date = new Date();
    const day = date.getDay();
    const nextDay = day > 4 ? 8 - day : 1;
    date.setDate(date.getDate() + nextDay);
    date.setHours(0,0,0,0);
    return date;
  }

  ngOnInit(): void {
    const state$ = this.sharedService.getBranch();
    const date$ = this.dateFilter.valueChanges.pipe(startWith(this.dateFilter.value));

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
        }),
        map(state => !_['branch'] ? {..._, branch: state} : _),
      )),
      tap(_ => this.parseParams(_)),
      tap(_ => this._orderRefreshTrigger$.next(true)
      ),
      switchMap(_ => this._loadList ? this.getDeliveries(_) : of([])),
      tap(_ => {
        console.log(_)
        this.loadingPage = false;
      })
    )
  }

  getDeliveries(params: Params): Observable<Delivery[]> {
    return this.deliveryCompletedService.getDeliveries(params['branch']);
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
      //filters['run'] = this.run;
    } else {
      //this.run = '';
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
    const sameTab = prev['tab'] === curr['tab'];
    return sameTab && sameRun && sameRefresh && this._loadList;
  }

  trackByFn(index: number, item: Delivery): string {
    return item.id;
  }

  trackByGroupsFn(index: number, item: any): string {
    return item.key;
  }

}
