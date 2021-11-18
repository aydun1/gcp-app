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
  private _cageTrackerUrl = `${this._dataGroupUrl}/e96c2778-2322-46d6-8de9-3d0c8ca5aefd`;


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
          tap(_ => this._columns$.next(_)),
          tap(_ => console.log(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  private createUrl(filters: any): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._cageTrackerUrl}/items?expand=fields`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'bin':
          return `fields/CageNumber eq ${filters.bin}`;
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

    if (!filterKeys.includes('assetType')) parsed.push(`fields/CageNumber gt 0`);
    if (!filterKeys.includes('status')) parsed.push(`fields/Status ne 'Complete'`);

    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/CageNumber asc&top=25`;
    return url;
  }

  private assignStatus(cage: Cage): Cage {
    if (cage.fields.CustomerNumber && !cage.fields.Date1) {
      cage['statusId'] = 1;
      cage['status'] = 'Assigned to customer';
    } else if (cage.fields.Date1 && !cage.fields.Date2) {
      cage['statusId'] = 2;
      cage['status'] = 'At customer';
    } else if (cage.fields.Date2 && !cage.fields.Weight) {
      cage['statusId'] = 3;
      cage['status'] = 'Collected from customer';
    } else if (cage.fields.Weight && !cage.fields.Date3) {
      cage['statusId'] = 4;
      cage['status'] = 'Collected from customer';
    } else if (cage.fields.Date3 && !cage.fields.Date4) {
      cage['statusId'] = 5;
      cage['status'] = 'At Polymer';
    } else if (cage.fields.Date4 && cage.fields.Status !== 'Complete') {
      cage['statusId'] = 6;
      cage['status'] = 'Collected from Polymer'
    } else {
      cage['status'] = cage.fields.Status;
    }
    return cage;
  }

  private getCages(url: string, paginate = false): Observable<Cage[]> {
    return this.http.get(url).pipe(
      tap(_ => {
        if (paginate) this._nextPage = _['@odata.nextLink'];
      }),
      map((res: {value: Cage[]}) => res.value.map(cage => this.assignStatus(cage)))
    );
  }

  getFirstPage(filters: any): BehaviorSubject<Cage[]> {
    this._nextPage = '';
    this._loadingCages = false;
    const url = this.createUrl(filters);
    this._loadingCages = true;
    this.getCages(url, true).subscribe(_ => {
      this._cagesSubject$.next(_);
      this._loadingCages = false;
    });
    return this._cagesSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingCages) return null;
    this._loadingCages = true;
    this._cagesSubject$.pipe(
      take(1),
      switchMap(acc => this.getCages(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr]),
        tap(() => this._loadingCages = false)
      ))
    ).subscribe(_ => this._cagesSubject$.next(_));
  }

  getCageHistory(cageNumber: number) {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/Modified desc&filter=fields/Status eq 'Complete' and fields/CageNumber eq ${cageNumber}`;
    return this.getCages(url);
  }

  getCage(id: string): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.get(url).pipe(map((res: Cage) => this.assignStatus(res)));
  }

  getCagesWithCustomer(custnmbr: string): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/Modified desc&filter=fields/CustomerNumber eq '${encodeURIComponent(custnmbr)}'`;
    return this.getCages(url);
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

  addNewCage(cageNumber: number, branch: string, assetType: string): Observable<any> {
    const url = this._cageTrackerUrl + `/items`;
    const payload = {fields: {Status: 'Available', CageNumber: cageNumber, Branch: branch, AssetType: assetType}};
    return this.http.post(url, payload);
  }

  markCageAvailable(id: string, cageNumber: number, branch: string, assetType: string): Observable<any> {
    const patchRequest = this.markCageComplete(id);
    const newRequest = this.addNewCage(cageNumber, branch, assetType);
    return forkJoin([patchRequest, newRequest]);
  }

  assignCageToCustomer(id: string, custnmbr: string, customerName: string): Observable<any> {
    const payload = {fields: {Status: 'In Use - At GCP Branch', CustomerNumber: custnmbr, Customer: customerName}};
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch(url, payload);
  }

  getAvailableCages(): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/CageNumber asc&filter=fields/Status eq 'Available'`;
    return this.getCages(url);
  }

  checkCageNumber(cageNumber: string): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items?expand=fields&filter=fields/CageNumber eq ${cageNumber} and fields/Status ne 'Complete'`;
    return this.getCages(url).pipe(map(res => res[0]));
  }

}
