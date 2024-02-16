import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Customer } from '../shared/customer';
import { CustomersService } from '../shared/customers.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { LoadingPageComponent } from '../../shared/loading/loading-page/loading-page.component';
import { LoadingRowComponent } from '../../shared/loading/loading-row/loading-row.component';

type Territory = {
  name?: string,
  territoryid?: string
};

@Component({
  selector: 'gcp-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatSelectModule, MatSortModule, MatTableModule, LetterheadComponent, LoadingPageComponent, LoadingRowComponent]
})
export class CustomerListComponent implements OnInit {
  private _loadList!: boolean;
  private _customerSubject$ = new BehaviorSubject<Customer[]>([]);

  public nameFilter = new FormControl('');
  public palletsFilter = new FormControl(['']);
  public branchFilter = new FormControl('');
  public customers$!: Observable<Customer[]>;
  public territories = this.shared.territoryNames;
  public loading = this.customersService.loading;
  public sortSort = this.route.snapshot.queryParamMap.get('sort') || '';
  public sortOrder = this.route.snapshot.queryParamMap.get('order') as SortDirection;
  public pallets = this.shared.palletDetails;
  public palletTotals = this.pallets.reduce((acc, curr) => (acc[curr.key]='',acc), {} as any);
  public displayedColumns = ['name', 'custNmbr', ...this.pallets.map(_ => _.key)];

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private customersService: CustomersService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.customersService.getNextPage();
  }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();
    this.customers$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(
        map(state => {
          return !params['territory'] ? {...params, territory: state} : {...params};
        })
      )),
      tap(_ => {
        this.parseParams(_);
        this.pallets.forEach(p => this.palletTotals[p.key] = 0);
      }),
      switchMap(_ => this._loadList ? this.customersService.getFirstPage(_) : []),
      tap(_ => this._customerSubject$.next(_)),
      tap(customers => {
        this.pallets.forEach(p => this.palletTotals[p.key] = customers.map(_ => _[p.key]).filter(_ => _).reduce((acc, val) => acc + val, 0));
      }),
      switchMap(_ => this._customerSubject$)
    )

    this.nameFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _ && _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'name': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('territory' in params) {
      this.branchFilter.patchValue(params['territory']);
    } else {
      this.branchFilter.patchValue('');
    }
    if ('pallets' in params) {
      const pallets = Array.isArray(params['pallets']) ? params['pallets'] : [params['pallets']];
      this.palletsFilter.patchValue(pallets);
    }
    if ('sort' in params) {
      this.sortSort = params['sort'];
      this.sortOrder = params['order'];
    }
    if ('name' in params) {
      this.nameFilter.patchValue(params['name']);
    } else {
      if (this.nameFilter.value) this.nameFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameName = prev['name'] === curr['name'];
    const sameTerritory = prev['territory'] === curr['territory'];
    const sameSort = prev['sort'] === curr['sort'];
    const sameOrder = prev['order'] === curr['order'];
    const samePallets = prev['pallets'] === curr['pallets'];
    return this._loadList && sameName && sameTerritory && sameSort && sameOrder && samePallets;
  }

  setRegion(territory: MatSelectChange): void {
    this.router.navigate([], { queryParams: {territory: territory.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setPallets(territory: MatSelectChange): void {
    this.router.navigate([], { queryParams: {pallets: territory.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearNameFilter(): void {
    this.nameFilter.patchValue('');
  }

  announceSortChange(e: Sort): void {
    const sort = e.direction ? e.active : null;
    const order = e.direction || null;
    this.router.navigate([], { queryParams: {sort, order}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByFn(index: number, item: Customer): string {
    return item.custNmbr;
  }
}
