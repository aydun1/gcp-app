import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Sort, SortDirection } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Customer } from '../shared/customer';
import { CustomersService } from '../shared/customers.service';

type Territory = {
  name?: string,
  territoryid?: string
};

@Component({
  selector: 'gcp-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  private loadList!: boolean;
  public nameFilter = new FormControl('');
  public palletsFilter = new FormControl(['']);
  public territoryFilter = new FormControl('');
  public customers$!: Observable<Customer[]>;
  public territories$!: Observable<Territory[]>;
  public get territories(): Array<string> {return this.sharedService.territoryNames};
  public loading = this.customersService.loading;
  public sortSort = this.route.snapshot.queryParamMap.get('sort') || '';
  public sortOrder = this.route.snapshot.queryParamMap.get('order') as SortDirection;
  public pallets = this.sharedService.palletDetails;
  public palletTotals = this.pallets.reduce((acc, curr) => (acc[curr.key]='',acc), {} as any);
  public displayedColumns = ['name', 'custNmbr', ...this.pallets.map(_ => _.key)];

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private customersService: CustomersService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    const state$ = this.sharedService.getBranch();
    this.customers$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(map(state => !params['territory'] ? {...params, territory: state} : params))),
      tap(_ => {
        this.parseParams(_);
        this.pallets.forEach(p => this.palletTotals[p.key] = 0);
      }),
      switchMap(_ => this.loadList ? this.getFirstPage(_) : []),
      tap(customers => {
        this.pallets.forEach(p => this.palletTotals[p.key] = customers.map(_ => _[p.key]).filter(_ => _).reduce((acc, val) => acc + val, 0));
      })
    )

    this.nameFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _ && _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'name': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();

    this.territories$ = this.getTerritories();
  }

  getTerritories(): Observable<Territory[]> {
    return this.customersService.getRegions().pipe(
      map(_ => _['value'])
    );
  }

  getFirstPage(_: Params): Observable<Customer[]> {
    return this.customersService.getFirstPage(_);
  }

  getNextPage(): void {
    this.customersService.getNextPage();
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('territory' in params) {
      this.territoryFilter.patchValue(params['territory']);
    } else {
      this.territoryFilter.patchValue('');
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
    if (!this.loadList && this.route.children.length === 0) {
      this.loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameName = prev['name'] === curr['name'];
    const sameTerritory = prev['territory'] === curr['territory'];
    const sameSort = prev['sort'] === curr['sort'];
    const sameOrder = prev['order'] === curr['order'];
    const samePallets = prev['pallets'] === curr['pallets'];
    return this.loadList && sameName && sameTerritory && sameSort && sameOrder && samePallets;
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
