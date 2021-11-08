import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { Cage } from './cage';


@Injectable({
  providedIn: 'root'
})
export class RecyclingService {

  private dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private cageTrackerUrl = `${this.dataGroupUrl}/afec6ed4-8ce3-45e7-8ac7-90428d664fc7/items`;
  constructor(
    private http: HttpClient
  ) { }

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
