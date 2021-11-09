import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, switchMap, take, tap } from 'rxjs';

import { Cage } from './cage';


@Injectable({
  providedIn: 'root'
})
export class RecyclingService {
  private _loadingCages: boolean;
  private _nextPage: string;
  private _cagesSubject$ = new BehaviorSubject<Cage[]>([]);
  private _dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private _cageTrackerUrl = `${this._dataGroupUrl}/afec6ed4-8ce3-45e7-8ac7-90428d664fc7`;

  constructor(
    private http: HttpClient
  ) { }

  getColumns() {
    let url = `${this._cageTrackerUrl}/columns`;
    return this.http.get(url);
  }

  createUrl(filters: any) {
    let url = `${this._cageTrackerUrl}/items?expand=fields`;
    const filterCount = Object.keys(filters).length;
    if(filterCount > 0) {
      url += '&$filter=';
      if ('name' in filters) url += `(startswith(name,'${filters.name}') or startswith(accountnumber,'${filters.name}'))`;
      if (filterCount > 1) url += ' and ';
      if ('territory' in filters) url += `territoryid/name eq '${filters.territory}'`;
    }
    url += `&top=25`;
    return url;
  }

  getFirstPage(filters: any) {
    this._nextPage = '';
    this._loadingCages = false;
    const url = this.createUrl(filters);
    this.getCages(url).subscribe(_ => this._cagesSubject$.next(_));
    return this._cagesSubject$;
  }

  getNextPage() {
    if (!this._nextPage || this._loadingCages) return null;
    this._cagesSubject$.pipe(
      take(1),
      switchMap(acc => this.getCages(this._nextPage).pipe(map(
        curr => [...acc, ...curr]
      )))
    ).subscribe(_ => this._cagesSubject$.next(_));
  }

  getCages(url: string) {
    this._loadingCages = true;
    return this.http.get(url).pipe(
      tap(_ => {
        this._nextPage = _['@odata.nextLink'];
        this._loadingCages = false;
      }),
      map((res: {value: Cage[]}) => res.value.reverse())
    );
  }

  getCagesWithCustomer(custnmbr: string): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=createdDateTime desc&filter=fields/CustomerNumber eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value.reverse()));
  }

  markCageWithCustomer(id: string) {
    const payload = {fields: {Status: 'In Use - At Customer', DueDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageAsCollected(id: string) {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CollectionDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageWithPolymer(id: string) {
    const payload = {fields: {Status: 'In Use - At Polymer', PurchaseDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageReturnedEmpty(id: string) {
    const payload = {fields: {Status: 'In Use - At GCP Branch', EmptyReceivedDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  setCageWeight(id: string, weight: number) {
    const payload = {fields: {Weight: weight}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageAvailable(id: string, binNumber: number, branch: string, assetType: string) {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    const patchPayload = {fields: {Status: 'Complete'}};
    const patchRequest = this.http.patch(url, patchPayload);
    const newPayload = {fields: {Status: 'Available', BinNumber2: binNumber, Branch: branch, AssetType: assetType}};
    const newRequest = this.http.post(`${this._cageTrackerUrl}/items`, newPayload);
    return forkJoin([patchRequest, newRequest]);
  }

  assignCageToCustomer(id: string, custnmbr: string) {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CustomerNumber: custnmbr}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  getAvailableCages() {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/BinNumber2 desc&filter=fields/Status eq 'Available'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value.reverse()));
  }
}
