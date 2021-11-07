import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Cage } from './cage';
import { Customer } from './customer';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {

  private url = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2';
  private dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private palletTrackerUrl = `${this.dataGroupUrl}/38f14082-02e5-4978-bf92-f42be2220166/items`;
  private cageTrackerUrl = `${this.dataGroupUrl}/afec6ed4-8ce3-45e7-8ac7-90428d664fc7/items`;

  constructor(
    private http: HttpClient
  ) { }

  createUrl(filters: any) {
    let url = `${this.url}/accounts?$select=name,accountnumber`;
    const filterCount = Object.keys(filters).length;
    if(filterCount > 0) {
      url += '&$filter=';
      if ('name' in filters) url += `startswith(name,'${filters.name}')`;
      if (filterCount > 1) url += ' and ';
      if ('territory' in filters) url += `territoryid/name eq '${filters.territory}'`;
    }
    url += '&$top=20';
    url += `&$orderby=name`;
    return url;
  }

  getCustomers() {
    const url = `${this.url}/accounts?$select=name,accountnumber&$top=20`;
    return this.http.get(url);
  }

  getCustomer(id: string): Observable<Customer> {
    const url = `${this.url}/accounts(${id})`;
    return this.http.get(url) as Observable<Customer>;
  }

  getCustomersStartingWith(filters: any) {
    const url = this.createUrl(filters);
    return this.http.get(url);
  }

  getRegions() {
    const url = `${this.url}/territories?$select=name`;
    return this.http.get(url);
  }

  addPallets(custnmbr: string, v: any) {
    const payload = {fields: {Title: custnmbr, Pallet: v.palletType, In: v.inQty, Out: v.outQty}};
    return this.http.post(this.palletTrackerUrl, payload);
  }

  getPallets(custnmbr: string) {
    const url = this.palletTrackerUrl + `?expand=fields(select=Title,Pallet,In,Out,Change)&filter=fields/Title eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }

  getCagesWithCustomer(custnmbr: string): Observable<Cage[]> {
    const url = this.cageTrackerUrl + `?expand=fields&filter=fields/CustomerNumber eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value));
  }

}
