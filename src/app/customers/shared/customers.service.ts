import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, tap } from 'rxjs';
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
    const url = this.cageTrackerUrl + `?expand=fields&orderby=createdDateTime desc&filter=fields/CustomerNumber eq '${encodeURIComponent(custnmbr)}'`;
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
