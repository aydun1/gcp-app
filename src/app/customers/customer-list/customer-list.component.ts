import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

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
  public territoryFilter = new FormControl('');
  public customers$!: Observable<Customer[]>;
  public territories$!: Observable<Territory[]>;
  public get territories(): Array<string> {return this.sharedService.territoryNames};
  public loading = this.customersService.loading;
  public displayedColumns = ['name', 'accountnumber', 'new_pallets_loscam', 'new_pallets_chep', 'new_pallets_plain'];
  public sortSort!: string;
  public sortOrder!: 'asc' | 'desc';
  public loscams!: number;
  public cheps!: number;
  public plains!: number;

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
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => state$.pipe(map(state => !_['territory'] ? {..._, territory: state} : _))),
      tap(_ => {
        this.parseParams(_);
        this.loscams = 0;
        this.cheps = 0;
        this.plains = 0;
      }),
      switchMap(_ => this.loadList ? this.getFirstPage(_) : []),
      tap(customers => {
        this.loscams = customers.map(_ => _.new_pallets_loscam).filter(_ => _).reduce((acc, val) => acc + val, 0);
        this.cheps = customers.map(_ => _.new_pallets_chep).filter(_ => _).reduce((acc, val) => acc + val, 0);
        this.plains = customers.map(_ => _.new_pallets_plain).filter(_ => _).reduce((acc, val) => acc + val, 0);
      }),

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

  getFirstPage(_: Params): BehaviorSubject<Customer[]> {
    return this.customersService.getFirstPage(_);
  }

  getNextPage(): void {
    this.customersService.getNextPage();
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters = {};
    if ('territory' in params) {
      this.territoryFilter.patchValue(params['territory']);
      filters['territory'] = params['territory'];
    } else {
      this.territoryFilter.patchValue('');
    }
    if ('sort' in params) {
      this.sortSort = params['sort'];
      this.sortOrder = params['order'];
    }
    if ('name' in params) {
      this.nameFilter.patchValue(params['name']);
      filters['name'] = params['name'];
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
    return this.loadList && sameName && sameTerritory && sameSort && sameOrder;
  }

  setRegion(territory: MatSelectChange): void {
    this.router.navigate([], { queryParams: {territory: territory.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearNameFilter(): void {
    this.nameFilter.patchValue('');
  }

  announceSortChange(e: Sort) {
    console.log(e)
    const sort = e.direction ? e.active : null;
    const order = e.direction || null;
    this.router.navigate([], { queryParams: {sort, order}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByFn(index: number, item: Customer): string {
    return item.accountid;
  }
}
