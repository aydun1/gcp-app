import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { Customer } from './customer';
import { Site } from './site';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private url = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2';
  private sitesUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists/1e955039-1d2e-41f8-98a2-688319720410';
  private nextPage: string;
  private customersSubject$ = new BehaviorSubject<Customer[]>([]);
  private _loadingCustomers: boolean;

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private shared: SharedService
  ) { }

  private createUrl(filters: Params): string {
    let url = `${this.url}/accounts?$select=name,accountnumber,territoryid`;
    const filterArray = [];
    if (filters['name']) filterArray.push(`(contains(name,'${this.shared.sanitiseName(filters['name'])}') or startswith(accountnumber,'${this.shared.sanitiseName(filters['name'])}'))`);
    if (filters['territory']) {
      if (filters['territory'] in this.shared.territories) {
        filterArray.push('(' + this.shared.territories[filters['territory']].map(_ => `territoryid/name eq '${_}'`).join(' or ') + ')');
      } else {
        filterArray.push(`territoryid/name eq '${filters['territory']}'`);
      }
    }
    filterArray.push('statecode eq 0');
    filterArray.push('accountnumber ne null');

    url += `&$filter=${filterArray.join(' and ')}`;
    url += `&$orderby=name`;
    return url;
  }

  getCustomer(id: string): Observable<Customer> {
    const url = `${this.url}/accounts(${id})`;
    return this.http.get(url) as Observable<Customer>;
  }

  getFirstPage(filters: Params): BehaviorSubject<Customer[]> {
    this.nextPage = '';
    this._loadingCustomers = false;
    const url = this.createUrl(filters);
    this.getCustomers(url).subscribe(_ => this.customersSubject$.next(_));
    return this.customersSubject$;
  }

  getNextPage(): void {
    if (!this.nextPage || this._loadingCustomers) return null;
    this.customersSubject$.pipe(
      take(1),
      switchMap(acc => this.getCustomers(this.nextPage).pipe(map(
        curr => [...acc, ...curr]
      )))
    ).subscribe(_ => this.customersSubject$.next(_))
  }

  getCustomers(url: string): Observable<Customer[]> {
    this._loadingCustomers = true;
    this.loading.next(true);
    return this.http.get(url, {headers: {Prefer: 'odata.maxpagesize=25'}}).pipe(
      tap(_ => {
        this.nextPage = _['@odata.nextLink'];
        this._loadingCustomers = false;
        this.loading.next(false);
      }),
      map((_: {value: Customer[]}) => _.value as Customer[])
    );
  }

  getRegions(): Observable<Object> {
    const url = `${this.url}/territories?$select=name`;
    return this.http.get(url);
  }

  getSites(customer: string): Observable<Site[]> {
    if (!customer) return of([]);
    const url = `${this.sitesUrl}/items?expand=fields(select=Title, Customer)&filter=fields/Customer eq '${this.shared.sanitiseName(customer)}'`;
    return this.http.get(url).pipe(map(_ => _['value']));
  }

  addSite(customer: string, site: string): Observable<Object> {
    const payload = {fields: {
      Customer: customer,
      Title: site
    }};
    return this.http.post(`${this.sitesUrl}/items`, payload);
  }

  renameSite(id: string, site: string): Observable<Object> {
    const payload = {fields: {
      Title: site
    }};
    return this.http.patch(`${this.sitesUrl}/items('${id}')`, payload);

  }
  deleteSite(id: string): Observable<Object> {
    return this.http.delete(`${this.sitesUrl}/items('${id}')`);
  }
}