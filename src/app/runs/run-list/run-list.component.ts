import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { Customer } from 'src/app/customers/shared/customer';
import { CustomerPickerDialogComponent } from 'src/app/customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { Site } from 'src/app/customers/shared/site';
import { SharedService } from 'src/app/shared.service';
import { Delivery } from '../shared/delivery';
import { DeliveryService } from '../shared/delivery.service';

@Component({
  selector: 'gcp-run-list',
  templateUrl: './run-list.component.html',
  styleUrls: ['./run-list.component.css']
})
export class RunListComponent implements OnInit {
  private _loadList: boolean;
  public deliveries$: Observable<Delivery[]>;
  public loadingList$ = this.deliveryService.loading;
  public loading: false;
  public displayedColumns = ['customer', 'site'];

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
      switchMap(_ => this._loadList ? this.getFirstPage(_) : [])
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
      switchMap(([id, customer, site]) => this.addDelivery(customer, site)),
    ).subscribe(() => {
      this.loading = false;
    });
  }




  addDelivery(customer: Customer, site: Site) {
    return this.deliveryService.createDelivery('runname', customer, site);
  }


  trackByFn(index: number, item: Delivery): string {
    return item.id;
  }

}
