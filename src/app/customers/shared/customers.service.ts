import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap, take, tap } from 'rxjs';
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
  private loadingCustomers: boolean;
  public territories = {
    'NSW': ['NSW', 'NSWSALES'],
    'QLD': ['QLD', 'QLDSALES'],
    'SA': ['SA', 'SASALES'],
    'VIC': ['ACT', 'HEATH', 'MISC', 'NT', 'NZ', 'OTHER', 'PRIMARY', 'VIC', 'VICSALES'],
    'WA': ['WA', 'WASALES']
  };

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: any) {
    let url = `${this.url}/accounts?$select=name,accountnumber,territoryid`;
    const filterCount = Object.keys(filters).length;
    if(filterCount > 0) {
      url += '&$filter=';
      if ('name' in filters) url += `(startswith(name,'${filters.name}') or startswith(accountnumber,'${filters.name}'))`;
      if (filterCount > 1) url += ' and ';
      if ('territory' in filters) {
        if (filters.territory in this.territories) {
          url += '(' + this.territories[filters.territory].map(_ => `territoryid/name eq '${_}'`).join(' or ') + ')'
        } else {
          url += `territoryid/name eq '${filters.territory}'`
        } };
    }
    url += `&$orderby=name`;
    return url;
  }

  getCustomer(id: string): Observable<Customer> {
    const url = `${this.url}/accounts(${id})`;
    return this.http.get(url) as Observable<Customer>;
  }

  getFirstPage(filters: any) {
    this.nextPage = '';
    this.loadingCustomers = false;
    const url = this.createUrl(filters);
    this.getCustomers(url).subscribe(_ => this.customersSubject$.next(_));
    return this.customersSubject$;
  }

  getNextPage() {
    if (!this.nextPage || this.loadingCustomers) return null;
    this.customersSubject$.pipe(
      take(1),
      switchMap(acc => this.getCustomers(this.nextPage).pipe(map(
        curr => [...acc, ...curr]
      )))
    ).subscribe(_ => this.customersSubject$.next(_))
  }

  getCustomers(url: string) {
    this.loadingCustomers = true;
    return this.http.get(url, {headers: {Prefer: 'odata.maxpagesize=25'}}).pipe(
      tap(_ => {
        this.nextPage = _['@odata.nextLink'];
        this.loadingCustomers = false;
      }),
      map((_: {value: Customer[]}) => _.value as Customer[])
    );
  }

  getRegions() {
    const url = `${this.url}/territories?$select=name`;
    return this.http.get(url);
  }

  getSites(customer: string): Observable<Site[]> {
    const url = `${this.sitesUrl}/items?expand=fields(select=Title, Customer)&filter=fields/Customer eq '${customer}'`;
    return this.http.get(url).pipe(map(_ => _['value']));
  }

  addSite(customer: string, site: string) {
    const payload = {fields: {
      Customer: customer,
      Title: site
    }};
    return this.http.post(`${this.sitesUrl}/items`, payload);
  }

  renameSite(id: string, site: string) {
    const payload = {fields: {
      Title: site
    }};
    return this.http.patch(`${this.sitesUrl}/items('${id}')`, payload);

  }
  deleteSite(id: string) {
    return this.http.delete(`${this.sitesUrl}/items('${id}')`);
  }
}