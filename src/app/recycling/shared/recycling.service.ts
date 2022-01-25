import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
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
    private http: HttpClient,
    private shared: SharedService
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
    cage['Date'] = cage.fields.Date4 || cage.fields.Date3 || cage.fields.Date2 || cage.fields.Date1 || cage.fields.Created; 
    if (cage.fields.Status === 'Available') {
      cage['statusId'] = 0;
    } else if (cage.fields.Status === 'Complete') {
      cage['statusId'] = 6;
    } else if (cage.fields.Date4 && cage.fields.Status !== 'Complete') {
      cage['statusId'] = 5;
    } else if (cage.fields.Date3 && !cage.fields.Date4) {
      cage['statusId'] = 4;
    } else if (cage.fields.Date2 && !cage.fields.Date3) {
      cage['statusId'] = 3;
    } else if (cage.fields.Date1 && !cage.fields.Date2) {
      cage['statusId'] = 2;
    } else if (cage.fields.CustomerNumber && !cage.fields.Date1) {
      cage['statusId'] = 1;
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

  private updateStatus(id, payload) {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch<Cage>(url, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  private updateList(res: Cage) {
    return this._cagesSubject$.pipe(
      take(1),
      map(_ => {
        const cages = _.map(cage => cage);
        const i = cages.findIndex(cage => cage.id === res.id);
        if (i > -1) cages[i] = res
        else cages.unshift(res);
        this._cagesSubject$.next(cages);
        return res;
      })
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

  getCageHistory(cageNumber: number, cageType: string) {
    let url = this._cageTrackerUrl + `/items?expand=fields(select=id,Customer,NetWeight,Modified)&orderby=fields/Modified desc&filter=fields/Status eq 'Complete'`;
    url += ` and fields/CageNumber eq ${cageNumber}`;
    url += ` and fields/AssetType eq '${cageType}'`;
    return this.getCages(url);
  }

  getCage(id: string): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.get(url).pipe(map((res: Cage) => this.assignStatus(res)));
  }

  getCagesWithCustomer(custnmbr: string, site = ''): Observable<Cage[]> {
    let url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/Modified desc&filter=fields/CustomerNumber eq '${this.shared.sanitiseName(custnmbr)}'`;
    if (site) url += `and fields/Site eq '${this.shared.sanitiseName(site)}'`;
    return this.getCages(url);
  }

  allocateToCustomer(id: string, custnmbr: string, customerName: string, site: string): Observable<any> {
    const payload = {fields: {Status: 'Allocated to customer', CustomerNumber: custnmbr, Customer: customerName}};
    if (site) payload['fields']['Site'] = site;
    return this.shared.getBranch().pipe(
      switchMap(_ => this.updateStatus(id, {...payload, Branch: _}))
    )
  }

  readyForCustomer(id: string): Observable<any> {
    const payload = {fields: {Status: 'Ready for delivery to customer'}};
    return this.updateStatus(id, payload);
  }

  deliverToCustomer(id: string): Observable<any> {
    const payload = {fields: {Status: 'Delivered to customer', Date1: new Date()}};
    return this.updateStatus(id, payload);
  }

  collectFromCustomer(id: string): Observable<any> {
    const payload = {fields: {Status: 'Collected from customer', Date2: new Date()}};
    return this.updateStatus(id, payload);
  }

  deliverToPolymer(id: string): Observable<any> {
    const payload = {fields: {Status: 'Delivered to Polymer', Date3: new Date()}};
    return this.updateStatus(id, payload);
  }

  readyForPolymer(id: string): Observable<any> {
    const payload = {fields: {Status: 'Ready for delivery to Polymer'}};
    return this.updateStatus(id, payload);
  }

  collectFromPolymer(id: string): Observable<any> {
    const payload = {fields: {Status: 'Collected from Polymer', Date4: new Date()}};
    return this.updateStatus(id, payload);
  }

  markCageComplete(id: string) {
    const payload = {fields: {Status: 'Complete'}};
    return this.updateStatus(id, payload);
  }

  collectAndComplete(id: string) {
    const payload = {fields: {Status: 'Complete', Date4: new Date()}};
    return this.updateStatus(id, payload);
  }

  setCageWeight(id: string, weight: number): Observable<any> {
    const payload = {fields: {CageWeight: weight}};
    return this.updateStatus(id, payload);
  }

  setGrossWeight(id: string, weight: number): Observable<any> {
    const payload = {fields: {GrossWeight: weight}};
    return this.updateStatus(id, payload);
  }

  setNotes(id: string, notes: string): Observable<Cage> {
    const payload = {fields: {Notes: notes}};
    return this.updateStatus(id, payload);
  }

  addNewCage(cageNumber: number, branch: string, assetType: string, cageWeight: number): Observable<any> {
    const url = this._cageTrackerUrl + `/items`;
    const payload = {fields: {Status: 'Available', CageNumber: cageNumber, Branch: branch, AssetType: assetType, CageWeight: cageWeight}};
    return this.http.post<Cage>(url, payload).pipe(
      switchMap(_ => this.updateList(_))
    );
  }

  markCageAvailable(id: string, cageNumber: number, branch: string, assetType: string, cageWeight: number): Observable<any> {
    const patchRequest = this.markCageComplete(id);
    const newRequest = this.addNewCage(cageNumber, branch, assetType, cageWeight);
    return forkJoin([patchRequest, newRequest]);
  }

  getAvailableCages(): Observable<Cage[]> {
    const url = this._cageTrackerUrl + `/items?expand=fields&orderby=fields/CageNumber asc&filter=fields/Status eq 'Available'`;
    return this.getCages(url);
  }

  checkCageNumber(cageNumber: string, cageType: string): Observable<Cage> {
    let url = this._cageTrackerUrl + `/items?expand=fields(select=id)&filter=fields/CageNumber eq ${cageNumber} and fields/Status ne 'Complete'`;
    if (cageType) url += ` and fields/AssetType eq '${cageType}'`;
    return this.getCages(url).pipe(map(res => res[0]));
  }

  uniqueCageValidator(assetTypeControl: FormControl) {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.checkCageNumber(control.value, assetTypeControl.value).pipe(
        map((exists) => (exists ? { cageExists: true } : null)),
        catchError((err) => null)
      );
    };
  }
}
