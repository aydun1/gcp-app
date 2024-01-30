import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, filter, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { Delivery } from '../shared/delivery';
import { Order } from '../shared/order';
import { Run } from '../shared/run';
import { SharedService } from '../../shared.service';
import { OrderLinesDialogComponent } from '../shared/order-lines-dialog/order-lines-dialog.component';
import { DeliveryCompletedService } from '../shared/delivery-completed.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';

@Component({
  selector: 'gcp-run-list-completed',
  templateUrl: './run-list-completed.component.html',
  styleUrls: ['./run-list-completed.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgForOf, NgIf, RouterModule, MatCardModule, MatCheckboxModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatTableModule, ReactiveFormsModule, LetterheadComponent]
})
export class RunListCompletedComponent implements OnInit {
  private _loadList = false;
  private _orderRefreshTrigger$ = new Subject<boolean>();
  private allColumns = ['date', 'run', 'order', 'customer', 'notes', 'checked'];
  public branchFilter = new FormControl('');
  public typeFilter = new FormControl('');
  public orderNumberFilter = new FormControl('');
  public dateFilter = new FormControl(this.getDate());
  public orders$!: Observable<Order[]>;
  public deliveries$!: Observable<Delivery[]>;
  public loadingList$ = this.deliveryCompletedService.loading;
  public runs: Array<Run> = [];
  public loading = false;
  public loadingPage = true;
  public empty = true;
  public displayedColumns = [...this.allColumns];
  public runName!: string;
  public states = this.sharedService.branches;
  public state = '';

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

    this.deliveries$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(
        map(state => {
          this.state = state;
          return !params['branch'] ? {...params, branch: state} : {...params};
        })
      )),
      tap(_ => this.parseParams(_)),
      tap(_ => this._orderRefreshTrigger$.next(true)
      ),
      switchMap(_ => this._loadList ? this.getDeliveries(_) : of([])),
      tap(_ => {
        this.loadingPage = false;
      })
    )

    this.orderNumberFilter.valueChanges.pipe(
      debounceTime(200),
      tap(_ => this.router.navigate([], { queryParams: {orderNumber: _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe()
  }

  getDeliveries(params: Params): Observable<Delivery[]> {
    return this.deliveryCompletedService.getDeliveries(params['branch'], params['type'], params['orderNumber']);
  }

  openReceipt(orderNumber: string): void {
    const data = {
      sopType: 2,
      sopNumber: orderNumber.trimEnd(),
    };

    this.dialog.open(OrderLinesDialogComponent, {width: '800px', data, autoFocus: false});
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
    } else {
      this.branchFilter.patchValue('');
    }
    if ('type' in params) {
      this.displayedColumns = [...this.allColumns];
      this.typeFilter.patchValue(params['type']);
    } else {
      this.displayedColumns = [...this.allColumns].slice(0, -1);
      this.typeFilter.patchValue('');
    }
    if ('orderNumber' in params) {
      this.orderNumberFilter.patchValue(params['orderNumber']);
    } else {
      this.typeFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameBranch = prev['branch'] === curr['branch'];
    const sameType = prev['type'] === curr['type'];
    const sameOrderNumber = prev['orderNumber'] === curr['orderNumber'];
    return sameBranch && sameType && this._loadList && sameOrderNumber;
  }

  markComplete(delivery: Delivery, currentStatus: number): void {
    this.deliveryCompletedService.changeStatuses([delivery.id], currentStatus);
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setType(type: MatSelectChange): void {
    this.router.navigate([], { queryParams: {type: type.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByFn(index: number, item: Delivery): string {
    return item.id;
  }

  trackByGroupsFn(index: number, item: {id: string}): string {
    return item.id;
  }

}
