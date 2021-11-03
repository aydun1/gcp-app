import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { CustomersService } from '../shared/customers.service';


type ProfileType = {
  givenName?: string,
  surname?: string,
  userPrincipalName?: string,
  id?: string,
  value?: any[]
};

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  public nameFilter = new FormControl('');
  public customers$: Observable<ProfileType>;
  private loadList: boolean;
  private filters: any;
  public displayedColumns = ['name', 'accountnumber'];
  public selectedRegion: string;

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
      switchMap(() => this.loadList ? this.getCustomers() : []),
    )

    this.nameFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _.length > 0 ? _ : null),
      tap(_ => this.router.navigate(['customers'], { queryParams: {'name': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();


  }

  getCustomers() {
    return this.customersService.getCustomersStartingWith(this.filters);
  }

  parseParams(params: Params) {
    if (!params) return;
    const filters: any = {};
    if ('name' in params) {
      this.nameFilter.patchValue(params.name);
      filters['name'] = params.name;
    } else {
      this.nameFilter.patchValue('');
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
    const sameName = prev.name === curr.name;
    return sameName;
  }

  setRegion(territory: any) {
    this.selectedRegion = territory;
    this.router.navigate(['customers'], { queryParams: {territory}, queryParamsHandling: 'merge', replaceUrl: true});
  }


  clearNameFilter() {
    this.nameFilter.patchValue('');
  }
}
