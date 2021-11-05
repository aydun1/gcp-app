import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { CustomersService } from '../shared/customers.service';


type Profile = {
  givenName: string,
  surname: string,
  userPrincipalName: string,
  id: string,
  value: any[]
};

type Territory = {
  name?: string,
  territoryid?: string
};

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  public nameFilter = new FormControl('');
  public territoryFilter = new FormControl('');
  public customers$: Observable<Profile>;
  public territories$: Observable<Territory[]>;

  private loadList: boolean;
  private filters: any;
  public displayedColumns = ['name', 'accountnumber'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customersService: CustomersService
  ) { }

  ngOnInit() {

    this.customers$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      ).pipe(map(s => _))),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      switchMap(() => this.loadList ? this.getCustomers() : [])
    )

    this.nameFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _.length > 0 ? _ : null),
      tap(_ => this.router.navigate(['customers'], { queryParams: {'name': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();

    this.territories$ = this.getTerritories();
  }

  getTerritories(): Observable<Territory[]> {
    return this.customersService.getRegions().pipe(
      map((_: any) => _.value)
    );
  }

  getCustomers() {
    return this.customersService.getCustomersStartingWith(this.filters);
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
    this.filters = filters;
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
    return sameName && sameTerritory;
  }

  setRegion(territory: MatSelectChange ) {
    this.router.navigate(['customers'], { queryParams: {territory: territory.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }


  clearNameFilter() {
    this.nameFilter.patchValue('');
  }
}
