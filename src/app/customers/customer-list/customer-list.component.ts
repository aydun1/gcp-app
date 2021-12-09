import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

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
  public nameFilter = new FormControl('');
  public territoryFilter = new FormControl('');
  public customers$: Observable<Customer[]>;
  public territories$: Observable<Territory[]>;

  public territories = [
    'NSW', 'QLD', 'SA', 'TAS', 'VIC', 'WA', 'INT', 'NATIONAL'
  ];

  private loadList: boolean;
  public displayedColumns = ['name', 'accountnumber'];

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private customersService: CustomersService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: any) {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit() {
    const state$ = this.sharedService.getBranch();
    this.customers$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => state$.pipe(map(state => !_['territory'] ? {..._, territory: state} : _))),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this.loadList ? this.getFirstPage(_) : [])
    )

    this.nameFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'name': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();

    this.territories$ = this.getTerritories();
  }

  getTerritories(): Observable<Territory[]> {
    return this.customersService.getRegions().pipe(
      map((_: any) => _.value)
    );
  }

  getFirstPage(_: any) {
    return this.customersService.getFirstPage(_);
  }

  getNextPage() {
    return this.customersService.getNextPage();
  }

  parseParams(params: Params) {
    if (!params) return;
    const filters: any = {};
    if ('territory' in params) {
      this.territoryFilter.patchValue(params['territory']);
      filters['territory'] = params['territory'];
    } else {
      this.territoryFilter.patchValue('');
    }

    if ('name' in params) {
      this.nameFilter.patchValue(params['name']);
      filters['name'] = params['name'];
    } else {
      if (this.nameFilter.value) this.nameFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params) {
    if (!this.loadList && this.route.children.length === 0) {
      this.loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameName = prev['name'] === curr['name'];
    const sameTerritory = prev['territory'] === curr['territory'];
    return sameName && sameTerritory && this.loadList;
  }

  setRegion(territory: MatSelectChange) {
    this.router.navigate([], { queryParams: {territory: territory.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearNameFilter() {
    this.nameFilter.patchValue('');
  }

  trackByFn(index: number, item: Customer) {
    return item.accountid;
  }
}
