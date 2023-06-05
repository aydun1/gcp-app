import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Params } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PalletsService } from '../../pallets/shared/pallets.service';
import { SharedService } from '../../shared.service';
import { Address } from './address';
import { Customer } from './customer';
import { Site } from './site';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private _url = `${environment.gpEndpoint}/customers`;
  private _listUrl = 'lists/1e955039-1d2e-41f8-98a2-688319720410';
  private _sitesUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _currentUrl!: string;
  private _nextPage = 1;
  private _customersSubject$ = new BehaviorSubject<Customer[]>([]);
  private _loadingCustomers!: boolean;
  private pageSize = 50;
  private pallets = this.shared.palletDetails;
  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private shared: SharedService,
    private palletsService: PalletsService
  ) { }

  private createUrl(filters: Params): string {
    let url = `${this._url}?`;
    const filterArray = [];
    if (filters['name']) filterArray.push(`search=${this.shared.sanitiseName(filters['name'])}`);
    const territoryFilter = filters['territory'] as 'HEA' | 'NSW' | 'QLD' | 'SA' | 'VIC' | 'WA';
    if (territoryFilter) {
      if (territoryFilter in this.shared.territories) {
        this.shared.territories[territoryFilter].forEach((_: string) => filterArray.push(`branch=${_}`));
      } else {
        filterArray.push(`branch=${territoryFilter}`);
      }
    }
    const palletFilters = Array.isArray(filters['pallets']) ? filters['pallets'] : [filters['pallets']];
    const palletFilter = this.pallets.filter(p => filters['sort'] === p.key || palletFilters.includes(p.key)).map(p => `filter=${p.key}`)
    if (palletFilter.length === 0) filterArray.push('inactive=0');
    if (palletFilter.length > 0) filterArray.push(`${palletFilter.join('&')}`);
    url += `&${filterArray.join('&')}`;
    url += `&orderby=${filters['sort'] || 'name'}`;
    url += `&order=${filters['order'] ? filters['order'] : 'asc'}`;
    return url;
  }

  getCustomer(id: string): Observable<Customer> {
    let url = `${this._url}/${this.shared.sanitiseName(id)}`;
    return this.http.get<{customer: Customer}>(url).pipe(map(_ => _['customer']));
  }

  getFirstPage(filters: Params): Observable<Customer[]> {
    this._nextPage = 1;
    this._loadingCustomers = false;
    this._currentUrl = this.createUrl(filters);

    return this._customersSubject$.pipe(
      take(1),
      switchMap(() => this.getCustomers(this._currentUrl)),
      tap(_ => this._customersSubject$.next(_)),
      switchMap(() => this._customersSubject$)
    );
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingCustomers) return;
    this._customersSubject$.pipe(
      take(1),
      switchMap(acc => this.getCustomers(this._currentUrl).pipe(
        map(curr => [...acc, ...curr])
      ))
    ).subscribe(_ => this._customersSubject$.next(_))
  }

  getCustomers(url: string): Observable<Customer[]> {
    this._loadingCustomers = true;
    this.loading.next(true);
    return this.http.get<{customers: Customer[]}>(`${url}&page=${this._nextPage}`).pipe(
      tap(_ => {
        this._nextPage += 1;
        if (_['customers'].length < this.pageSize) this._nextPage = 0;
        this._loadingCustomers = false;
        this.loading.next(false);
      }),
      map((_: any) => _.customers as Customer[]),
      catchError(error => {
        this._loadingCustomers = false;
        this.loading.next(false);
        if (error.status === 403) alert('No access. Contact Aidan to have your account enabled to use this page.');
        if (error.error instanceof ErrorEvent) {
            console.log(`Error: ${error.error.message}`);
        } else {
          console.log(`Error: ${error.message}`);
        }
        return of([] as Customer[]);
      })
    );
  }

  getAddresses(customer: string | null): Observable<Address[]> {
    if (!customer) return of([]);
    let url = `${this._url}/${this.shared.sanitiseName(customer)}/addresses`;
    return this.http.get<{addresses: Address[]}>(url).pipe(map(_ => _['addresses']));
  }

  getRegions(): Observable<any> {
    const url = `${this._url}/territories?$select=name`;
    return this.http.get<any>(url);
  }

  getSites(customer: string): Observable<Site[]> {
    if (!customer) return of([]);
    const url = `${this._sitesUrl}/items?expand=fields(select=Title,Address,Customer)&filter=fields/Customer eq '${this.shared.sanitiseName(customer)}'`;
    return this.http.get<{value: Site[]}>(url).pipe(map(_ => _['value']));
  }

  editSite(customer: Customer, siteId: string, newName: string, oldName: string, newAddress: string | null | undefined): Observable<Object> {
    const payload = {fields: {
      Title: newName,
      Address: newAddress
    }};
    const action = this.http.patch(`${this._sitesUrl}/items('${siteId}')`, payload);
    return newName === oldName ? action : this.sitePalletTransfer(action, customer, oldName, newName);
  }

  addSite(customer: Customer, siteName: string, address: string | null | undefined): Observable<Object> {
    const payload = {fields: {
      Customer: customer.custNmbr,
      Title: siteName,
      Address: address
    }};
    if (address) payload['fields']['Address'] = address;
    const action = this.http.post(`${this._sitesUrl}/items`, payload);
    return this.sitePalletTransfer(action, customer, '', siteName);
  }

  deleteSite(customer: Customer, siteId: string, oldName: string): Observable<Object> {
    const action = this.http.delete(`${this._sitesUrl}/items('${siteId}')`);
    return this.sitePalletTransfer(action, customer, oldName, '');
  }

  uniqueSiteValidator(sites: Array<Site>): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!sites) return null;
      const siteNames = sites.map(_ => _.fields.Title);
      const exists = siteNames.includes(control.value);
      return exists ? {forbiddenName: {value: control.value}} : null;
    };
  }

  private sitePalletTransfer(action: Observable<Object>, customer: Customer, oldName: string, newName: string): Observable<Object> {
    return action.pipe(
      switchMap(() => this.palletsService.getPalletsOwedByCustomer(customer.custNmbr, oldName)),
      switchMap(pallets => this.palletsService.siteTransfer(customer.name, customer.custNmbr, oldName, newName, pallets))
    );
  }
}