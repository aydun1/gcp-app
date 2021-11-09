import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';

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
  private _columns: any;

  constructor(
    private http: HttpClient
  ) { }

  getColumns() {
    if (this._columns) return of(this._columns);
    let url = `${this._cageTrackerUrl}/columns`;
    return this.http.get(url).pipe(
      map((_: any) => _.value),
      map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
      tap(_ => this._columns = _)
    );
  }

  createUrl(filters: any): string {
    let url = `${this._cageTrackerUrl}/items?expand=fields`;

    const parsed = Object.keys(filters).map(key => {
      switch (key) {
        case 'bin':
          return `fields/BinNumber2 eq ${filters.bin}`;
        case 'status':
          return `fields/Status eq '${filters.status}'`;
        case 'assetType':
          return `fields/AssetType eq '${filters.assetType}'`;
        default:
          return '';
      }
    }).filter(_ => _);

    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/BinNumber2 asc&top=25`;
    return url;
  }

  getFirstPage(filters: any): BehaviorSubject<Cage[]> {
    this._nextPage = '';
    this._loadingCages = false;
    const url = this.createUrl(filters);
    this.getCages(url).subscribe(_ => this._cagesSubject$.next(_));
    return this._cagesSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingCages) return null;
    this._cagesSubject$.pipe(
      take(1),
      switchMap(acc => this.getCages(this._nextPage).pipe(
        map(curr => [...acc, ...curr])
      ))
    ).subscribe(_ => this._cagesSubject$.next(_));
  }

  getCages(url: string): Observable<Cage[]> {
    this._loadingCages = true;
    return this.http.get(url).pipe(
      tap(_ => {
        this._nextPage = _['@odata.nextLink'];
        this._loadingCages = false;
      }),
      map((res: {value: Cage[]}) => res.value)
    );
  }

  getCagesWithCustomer(custnmbr: string): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=createdDateTime desc&filter=fields/CustomerNumber eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value.reverse()));
  }

  markCageWithCustomer(id: string): Observable<any> {
    const payload = {fields: {Status: 'In Use - At Customer', DueDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageAsCollected(id: string): Observable<any> {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CollectionDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageWithPolymer(id: string): Observable<any> {
    const payload = {fields: {Status: 'In Use - At Polymer', PurchaseDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageReturnedEmpty(id: string): Observable<any> {
    const payload = {fields: {Status: 'In Use - At GCP Branch', EmptyReceivedDate: new Date()}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  setCageWeight(id: string, weight: number): Observable<any> {
    const payload = {fields: {Weight: weight}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  markCageAvailable(id: string, binNumber: number, branch: string, assetType: string): Observable<any> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    const patchPayload = {fields: {Status: 'Complete'}};
    const patchRequest = this.http.patch(url, patchPayload);
    const newPayload = {fields: {Status: 'Available', BinNumber2: binNumber, Branch: branch, AssetType: assetType}};
    const newRequest = this.http.post(`${this._cageTrackerUrl}/items`, newPayload);
    return forkJoin([patchRequest, newRequest]);
  }

  assignCageToCustomer(id: string, custnmbr: string): Observable<any> {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CustomerNumber: custnmbr}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  getAvailableCages(): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/BinNumber2 asc&filter=fields/Status eq 'Available'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value));
  }
}
