import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { Params } from '@angular/router';
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

  private types = {
    'Cage - Solid (2.5m³)': 'Solid cage',
    'Cage - Folding (2.5m³)': 'Folding cage'
  }

  constructor(
    private http: HttpClient,
    private shared: SharedService
  ) { }

  getColumns(): BehaviorSubject<any> {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get(`${this._cageTrackerUrl}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_)),
        );
      }),
      switchMap(_ => _),
      tap(_ => console.log(_))
    ).subscribe();
    return this._columns$;
  }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._cageTrackerUrl}/items?expand=fields`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'bin':
          return `fields/CageNumber eq ${filters['bin']}`;
        case 'branch':
          return `fields/Branch eq '${filters['branch']}'`;
        case 'status':
          return `fields/Status eq '${filters['status']}'`;
        case 'assetType':
          return `fields/AssetType eq '${filters['assetType']}'`;
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
    console.log(cage)
    cage['Date'] = cage.fields.Date4 || cage.fields.Date3 || cage.fields.ToLocalProcessing || cage.fields.Date2 || cage.fields.Date1 || cage.fields.Created;
    cage['Cage'] = cage.fields.AssetType?.startsWith('Cage');
    cage['Type'] = cage['Cage'] ? cage.fields.AssetType.split('-', 2)[1].split(' ', 2)[1][0].toLowerCase() : null;
    cage.fields['AssetTypeClean'] = this.types[cage.fields.AssetType] || cage.fields.AssetType;


    if (cage.fields.Status === 'Available') {
      cage['statusId'] = 0;
    } else if (cage.fields.Status === 'Complete') {
      cage['statusId'] = 7;
    } else if ((cage.fields.Date4 || cage.fields.FromLocalProcessing) && cage.fields.Status !== 'Complete') {
      cage['statusId'] = 6;
    } else if (cage.fields.Date3 && !cage.fields.Date4) {
      cage['statusId'] = 5;
    } else if (cage.fields.ToLocalProcessing && !cage.fields.FromLocalProcessing) {
      cage['statusId'] = 4;
    } else if ((cage.fields.Date2) && !(cage.fields.Date3)) {
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

  private updateStatus(id, payload): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch<Cage>(url, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  private updateList(res: Cage): Observable<Cage> {
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

  getFirstPage(filters: Params): BehaviorSubject<Cage[]> {
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

  getCageHistory(cageNumber: number, cageType: string): Observable<Cage[]> {
    let url = this._cageTrackerUrl + `/items?expand=fields(select=id,Customer,NetWeight,Modified,Created,Status)&orderby=fields/Created desc&filter=`;
    url += ` fields/CageNumber eq ${cageNumber}`;
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

  allocateToCustomer(id: string, custnmbr: string, customerName: string, site: string): Observable<Cage> {
    const payload = {fields: {Status: 'Allocated to customer', CustomerNumber: custnmbr, Customer: customerName}};
    if (site) payload['fields']['Site'] = site;
    return this.shared.getBranch().pipe(
      switchMap(_ => this.updateStatus(id, {...payload, Branch: _}))
    )
  }

  readyForCustomer(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Ready for delivery to customer'}};
    return this.updateStatus(id, payload);
  }

  deliverToCustomer(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Delivered to customer', Date1: new Date()}};
    return this.updateStatus(id, payload);
  }

  collectFromCustomer(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Collected from customer', Date2: new Date()}};
    return this.updateStatus(id, payload);
  }

  deliverToPolymer(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Delivered to Polymer', Date3: new Date()}};
    return this.updateStatus(id, payload);
  }

  deliverToProcessing(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Delivered to local processing', ToLocalProcessing: new Date()}};
    return this.updateStatus(id, payload);
  }

  readyForPolymer(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Ready for delivery to Polymer'}};
    return this.updateStatus(id, payload);
  }

  collectFromPolymer(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Collected from Polymer', Date4: new Date()}};
    return this.updateStatus(id, payload);
  }

  collectFromProcessing(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Collected from local processing', FromLocalProcessing: new Date()}};
    return this.updateStatus(id, payload);
  }
  
  markCageComplete(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Complete'}};
    return this.updateStatus(id, payload);
  }

  collectAndComplete(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Complete', Date4: new Date()}};
    return this.updateStatus(id, payload);
  }

  setCageWeight(id: string, weight: number): Observable<Cage> {
    const payload = {fields: {CageWeight: weight}};
    return this.updateStatus(id, payload);
  }

  setGrossWeight(id: string, weight: number): Observable<Cage> {
    const payload = {fields: {GrossWeight: weight}};
    return this.updateStatus(id, payload);
  }

  setNotes(id: string, notes: string): Observable<Cage> {
    const payload = {fields: {Notes: notes}};
    return this.updateStatus(id, payload);
  }

  addNewCage(cageNumber: number, branch: string, assetType: string, cageWeight: number): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items`;
    const payload = {fields: {Status: 'Available', CageNumber: cageNumber, Branch: branch, AssetType: assetType, CageWeight: cageWeight}};
    return this.http.post<Cage>(url, payload).pipe(
      switchMap(_ => this.updateList(_))
    );
  }

  markCageAvailable(id: string, cageNumber: number, branch: string, assetType: string, cageWeight: number): Observable<[Cage, Cage]> {
    const patchRequest = this.markCageComplete(id);
    const newRequest = this.addNewCage(cageNumber, branch, assetType, cageWeight);
    return forkJoin([patchRequest, newRequest]);
  }

  resetCage(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Available', CustomerNumber: null, Customer: null, Date1: null, Date2: null, Date3: null, Date4: null, GrossWeight: null}};
    return this.updateStatus(id, payload);
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

  uniqueCageValidator(assetTypeControl: FormControl): any {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.checkCageNumber(control.value, assetTypeControl.value).pipe(
        map((exists) => (exists ? { cageExists: true } : null)),
        catchError((err) => null)
      );
    };
  }
}
