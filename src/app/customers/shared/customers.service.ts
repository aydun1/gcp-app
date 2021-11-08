import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, switchMap, take, tap } from 'rxjs';
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
  private nextPage: string;
  private customersSubject$ = new BehaviorSubject<Customer[]>([]);
  private loadingCustomers: boolean;
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
    url += `&$orderby=name`;
    return url;
  }

  getCustomer(id: string): Observable<Customer> {
    const url = `${this.url}/accounts(${id})`;
    return this.http.get(url) as Observable<Customer>;
  }

  getCustomerList() {
    return this.customersSubject$;
  }

  getFirstPage(filters: any) {
    this.nextPage = '';
    this.loadingCustomers = false;
    const url = this.createUrl(filters);
    this.getCustomers(url).subscribe(_ => this.customersSubject$.next(_));
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

  addPallets(custnmbr: string, v: any) {
    const payload = {fields: {Title: custnmbr, Pallet: v.palletType, In: v.inQty, Out: v.outQty}};
    return this.http.post(this.palletTrackerUrl, payload);
  }

  getPallets(custnmbr: string) {
    const url = this.palletTrackerUrl + `?expand=fields(select=Title,Pallet,In,Out,Change)&filter=fields/Title eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }

  getCagesWithCustomer(custnmbr: string): Observable<Cage[]> {
    const url = this.cageTrackerUrl + `?expand=fields&top=1&orderby=createdDateTime desc&filter=fields/CustomerNumber eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value.reverse()));
  }

  markCageWithCustomer(id: string) {
    const payload = {fields: {Status: 'In Use - At Customer', DueDate: new Date()}};
    const url = this.cageTrackerUrl + `('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageAsCollected(id: string) {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CollectionDate: new Date()}};
    const url = this.cageTrackerUrl + `('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageWithPolymer(id: string) {
    const payload = {fields: {Status: 'In Use - At Polymer', PurchaseDate: new Date()}};
    const url = this.cageTrackerUrl + `('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageReturnedEmpty(id: string) {
    const payload = {fields: {Status: 'In Use - At GCP Branch', EmptyReceivedDate: new Date()}};
    const url = this.cageTrackerUrl + `('${id}')`;
    return this.http.patch(url, payload);
  }

  setCageWeight(id: string, weight: number) {
    const payload = {fields: {Weight: weight}};
    const url = this.cageTrackerUrl + `('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageAvailable(id: string, binNumber: number, branch: string, assetType: string) {
    const url = this.cageTrackerUrl + `('${id}')`;
    const patchPayload = {fields: {Status: 'Complete'}};
    const patchRequest = this.http.patch(url, patchPayload);
    const newPayload = {fields: {Status: 'Available', BinNumber2: binNumber, Branch: branch, AssetType: assetType}};
    const newRequest = this.http.post(this.cageTrackerUrl, newPayload);
    return forkJoin([patchRequest, newRequest]);
  }

  assignCageToCustomer(id: string, custnmbr: string) {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CustomerNumber: custnmbr}};
    const url = this.cageTrackerUrl + `('${id}')`;
    return this.http.patch(url, payload);
  }

  getAvailableCages() {
    const url = this.cageTrackerUrl + `?expand=fields&orderby=fields/BinNumber2 desc&filter=fields/Status eq 'Available'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value.reverse()));
  }
}
