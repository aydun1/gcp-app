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
  private _url = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2';
  private _listUrl = 'lists/1e955039-1d2e-41f8-98a2-688319720410';
  private _sitesUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _nextPage!: string;
  private _customersSubject$ = new BehaviorSubject<Customer[]>([]);
  private _loadingCustomers!: boolean;

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private shared: SharedService,
    private palletsService: PalletsService
  ) { }

  private createUrl(filters: Params): string {
    let url = `${this._url}/accounts?$select=name,accountnumber,address1_composite,new_pallets_loscam,new_pallets_chep,new_pallets_plain`;
    const filterArray = [];
    if (filters['name']) filterArray.push(`(contains(name,'${this.shared.sanitiseName(filters['name'])}') or startswith(accountnumber,'${this.shared.sanitiseName(filters['name'])}'))`);
    if (filters['territory']) {
      if (filters['territory'] in this.shared.territories) {
        filterArray.push('(' + this.shared.territories[filters['territory']].map((_: any) => `territoryid/name eq '${_}'`).join(' or ') + ')');
      } else {
        filterArray.push(`territoryid/name eq '${filters['territory']}'`);
      }
    }
    filterArray.push('accountnumber ne null');

    const palletFilter = []
    if (filters['sort'] === 'new_pallets_loscam') palletFilter.push('new_pallets_loscam gt 0 or new_pallets_loscam lt 0');
    else if (filters['sort'] === 'new_pallets_chep') palletFilter.push('new_pallets_chep gt 0 or new_pallets_chep lt 0');
    else if (filters['sort'] === 'new_pallets_plain') palletFilter.push('new_pallets_plain gt 0 or new_pallets_plain lt 0');
    else filterArray.push('statecode eq 0');
    if (palletFilter.length > 0) filterArray.push(`(${palletFilter.join(' or ')})`);

    url += `&$filter=${filterArray.join(' and ')}`;
    url += `&$orderby=${filters['sort'] ? filters['sort'] : 'name'}`;
    url += ` ${filters['order'] ? filters['order'] : 'asc'}`;
    return url;
  }

  getCustomer(id: string): Observable<Customer> {
    if (id.length < 8) return this.getCustomerByAccount(id);
    const url = `${this._url}/accounts(${id})?$select=name,accountnumber,address1_composite`;
    return this.http.get(url) as Observable<Customer>;
  }

  getCustomerByAccount(customerNumber: string): Observable<Customer> {
    const url = `${this._url}/accounts?$select=name,accountnumber,address1_composite&$filter=accountnumber eq '${customerNumber}'`;
    const customers = this.http.get(url) as Observable<{value: Customer[]}>;
    return customers.pipe(
      map(_ => _.value[0])
    );
  }

  getFirstPage(filters: Params): BehaviorSubject<Customer[]> {
    this._nextPage = '';
    this._loadingCustomers = false;
    const url = this.createUrl(filters);
    this.getCustomers(url).subscribe(_ => this._customersSubject$.next(_));
    return this._customersSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingCustomers) return;
    this._customersSubject$.pipe(
      take(1),
      switchMap(acc => this.getCustomers(this._nextPage).pipe(
        map(curr => [...acc, ...curr])
      ))
    ).subscribe(_ => this._customersSubject$.next(_))
  }

  getCustomers(url: string): Observable<Customer[]> {
    this._loadingCustomers = true;
    this.loading.next(true);
    return this.http.get(url, {headers: {Prefer: 'odata.maxpagesize=25'}}).pipe(
      tap(_ => {
        this._nextPage = _['@odata.nextLink'];
        this._loadingCustomers = false;
        this.loading.next(false);
      }),
      map((_: any) => _.value as Customer[]),
      catchError(error => {
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

  getAddresses(customer: string): Observable<Address[]> {
    let url = `${this._url}/customeraddresses?$select=name,addressnumber,addresstypecode,primarycontactname,line1,line2,line3,city,stateorprovince,postalcode`;
    url = customer.length <= 7 ?
    `${url}&$filter=parentid_account/accountnumber eq '${customer}'` :
    `${url}&$filter=_parentid_value eq '${customer}'`;
    return this.http.get(url).pipe(map(_ => _['value']));
  }

  getRegions(): Observable<Object> {
    const url = `${this._url}/territories?$select=name`;
    return this.http.get(url);
  }

  getSites(customer: string): Observable<Site[]> {
    if (!customer) return of([]);
    const url = `${this._sitesUrl}/items?expand=fields(select=Title,Address,Customer)&filter=fields/Customer eq '${this.shared.sanitiseName(customer)}'`;
    return this.http.get(url).pipe(map(_ => _['value']));
  }

  renameSite(customer: Customer, siteId: string, newName: string, oldName: string, newAddress: string): Observable<Object> {
    const payload = {fields: {
      Title: newName,
      Address: newAddress
    }};
    const action = this.http.patch(`${this._sitesUrl}/items('${siteId}')`, payload);
    return this.sitePalletTransfer(action, customer, oldName, newName);
  }

  addSite(customer: Customer, newName: string, newAddress: string): Observable<Object> {
    const payload = {fields: {
      Customer: customer.accountnumber,
      Title: newName,
      Address: newAddress
    }};
    const action = this.http.post(`${this._sitesUrl}/items`, payload);
    return this.sitePalletTransfer(action, customer, '', newName);
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
      switchMap(() => this.palletsService.getPalletsOwedByCustomer(customer.accountnumber, oldName)),
      switchMap(pallets => this.palletsService.siteTransfer(this.shared.branch, customer.name, customer.accountnumber, oldName, newName, pallets))
    );
  }
}