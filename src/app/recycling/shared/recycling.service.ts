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
  private _columns$ = new BehaviorSubject<any>(null);
  private _dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private _cageTrackerUrl = `${this._dataGroupUrl}/afec6ed4-8ce3-45e7-8ac7-90428d664fc7`;


  constructor(
    private http: HttpClient
  ) { }

  getColumns() {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get(`${this._cageTrackerUrl}/columns`).pipe(
          map((_: any) => _.value),
          map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  createUrl(filters: any): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._cageTrackerUrl}/items?expand=fields`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'bin':
          return `fields/BinNumber2 eq ${filters.bin}`;
        case 'branch':
          return `fields/Branch eq '${filters.branch}'`;
        case 'status':
          return `fields/Status eq '${filters.status}'`;
        case 'assetType':
          return `fields/AssetType eq '${filters.assetType}'`;
        default:
          return '';
      }
    }).filter(_ => _);

    if (!filterKeys.includes('assetType')) parsed.push(`fields/BinNumber2 gt 0`);
    if (!filterKeys.includes('status')) parsed.push(`fields/Status ne 'Complete'`);

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

  getCageHistory(binNumber: number) {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/Modified desc&filter=fields/Status eq 'Complete' and fields/BinNumber2 eq ${binNumber}`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value));
  }

  getCage(id: string): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.get(url).pipe(map((res: Cage) => res));
  }

  getCagesWithCustomer(custnmbr: string): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/Modified desc&filter=fields/CustomerNumber eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value));
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

  markCageComplete(id: string) {
    const payload = {fields: {Status: 'Complete'}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  setCageWeight(id: string, weight: number): Observable<any> {
    const payload = {fields: {Weight: weight}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  addNewCage(binNumber: number, branch: string, assetType: string): Observable<any> {
    const url = this._cageTrackerUrl + `/items`;
    const payload = {fields: {Status: 'Available', BinNumber2: binNumber, Branch: branch, AssetType: assetType}};
    return this.http.post(url, payload);
  }

  markCageAvailable(id: string, binNumber: number, branch: string, assetType: string): Observable<any> {
    const patchRequest = this.markCageComplete(id);
    const newRequest = this.addNewCage(binNumber, branch, assetType);
    return forkJoin([patchRequest, newRequest]);
  }

  assignCageToCustomer(id: string, custnmbr: string, customerName: string): Observable<any> {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CustomerNumber: custnmbr, Customer: customerName}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  getAvailableCages(): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/BinNumber2 asc&filter=fields/Status eq 'Available'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value));
  }

  checkCageNumber(cageNumber: string): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items?expand=fields&filter=fields/BinNumber2 eq ${cageNumber} and fields/Status ne 'Complete'`;
    return this.http.get(url).pipe(map((res: {value: Cage[]}) => res.value[0]));
  }

}
