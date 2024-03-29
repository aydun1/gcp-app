import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params } from '@angular/router';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';

import { Site } from '../../customers/shared/site';
import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { Choice } from '../../shared/choice';
import { Cage } from './cage';
import { BranchTotal } from './branch-total';


@Injectable({
  providedIn: 'root'
})
export class RecyclingService {
  private _loadingCages!: boolean;
  private _nextPage!: string;
  private _cagesSubject$ = new BehaviorSubject<Cage[]>([]);
  private _columns$ = new BehaviorSubject<{Placeholder: boolean, AssetType: Choice, Status: Choice, Branch: Choice}>(
    {Placeholder: true, AssetType: {choice: {choices: []}, name: ''}, Status: {choice: {choices: []}, name: ''}, Branch: {choice: {choices: []}, name: ''}}
  );
  private _totalsUrl = 'lists/7354d3dc-88fe-4184-b069-13e5ee6cf56f';
  private _listUrl = 'lists/e96c2778-2322-46d6-8de9-3d0c8ca5aefd';
  private _cageTrackerUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _totalsTrackerUrl = `${environment.endpoint}/${environment.siteUrl}/${this._totalsUrl}`;
  private types = {
    'Cage - Solid (2.5m³)': 'Solid cage',
    'Cage - Folding (2.5m³)': 'Folding cage'
  };

  public loading = new BehaviorSubject<boolean>(false);
  public materials = [
    {code: 2, name: 'HDPE', image:'hdpe2-logo.png'},
    {code: 5, name: 'PP', image:'pp5-logo.png'},
    {code: 6, name: 'PS', image:'ps6-logo.png'}
  ];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService
  ) { }

  getColumns(): BehaviorSubject<any> {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (!_.Placeholder) return of(_);
        return this.http.get<{value: any[]}>(`${this._cageTrackerUrl}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((a: any, v: any) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _),
    ).subscribe();
    return this._columns$;
  }

  getNextCageId(id: string, prev: boolean): Observable<string> {
    return this._cagesSubject$.pipe(
      map(_ => {
        if (!id) return '';
        const index = _.findIndex(_ => _.id === id);
        if (_.length - index < 5 ) this.getNextPage();
        const direction = prev ? -1 : 1;
        return _[index + direction]?.id;
    }))
  }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._cageTrackerUrl}/items?expand=fields`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'bin':
          return `fields/CageNumber eq ${filters['bin']}`;
        case 'branch':
          if (!filters['branch']) return;
          return `fields/Branch eq '${filters['branch']}'`;
        case 'status':
          if (filters['status'] === 'Polymer') return `fields/Date3 ne null`;
          if (filters['status'] === 'Local processing') return `fields/ToLocalProcessing ne null`;
          return `fields/Status eq '${filters['status']}'`;
        case 'assetType':
          if (filters['assetType'] === 'Cage') return `fields/CageNumber ne null`;
          if (filters['assetType'] === 'Other') return `fields/CageNumber eq null`;
          return `fields/AssetType eq '${filters['assetType']}'`;
        case 'month':
          const yearMth = filters['month'].split('-').map((_: string) => parseInt(_));
          const startDate = new Date(`${yearMth[0]}-${yearMth[1]+1}-1`)
          const endDate = new Date(`${yearMth[1] < 11 ? yearMth[0] : yearMth[0] + 1}-${yearMth[1] < 11 ? yearMth[1]+2 : 1}-1`)
          return `fields/Date2 gt '${startDate.toISOString()}' and fields/Date2 lt '${endDate.toISOString()}'`;
        case 'material':
          return `fields/Material eq '${filters['material']}'`;
        default:
          return '';
      }
    }).filter(_ => _);

    if (!filterKeys.includes('status') && !filterKeys.includes('month')) parsed.unshift(`fields/Status ne 'Complete'`);
    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&$orderby=${filters['sort'] ? filters['sort'] : filters['assetType'] === 'Other' ? 'fields/Modified' : 'fields/CageNumber'}`;
    url += ` ${filters['order'] ? filters['order'] : filters['assetType'] === 'Other' ? 'desc' : 'asc'}`;
    url += `&top=50`;
    return url;
  }

  private assignStatus(cage: Cage): Cage {
    if (!cage.fields) return cage;
    cage['material'] = this.materials.find(_ => _.code === cage.fields.Material) || null;
    cage['Date'] = cage.fields.Date4 || cage.fields.Date3 || cage.fields.ToLocalProcessing || cage.fields.Date2 || cage.fields.Date1 || cage.fields.Created;
    cage['Cage'] = cage.fields.AssetType?.startsWith('Cage');
    cage['Type'] = cage['Cage'] ? cage.fields.AssetType.split('-', 2)[1].split(' ', 2)[1][0].toLowerCase() : null;
    cage.fields['AssetTypeClean'] = this.types[cage.fields.AssetType] || cage.fields.AssetType;
    if (cage.fields.Status === 'Available') {
      cage['statusId'] = 0;
      cage['location'] = cage.fields.Depot || cage.fields.Branch;
    } else if (cage.fields.Status === 'Complete') {
      cage['statusId'] = 7;
    } else if ((cage.fields.Date4 || cage.fields.FromLocalProcessing) && cage.fields.Status !== 'Complete') {
      cage['statusId'] = 6;
      cage['location'] = cage.fields.Branch;
    } else if (cage.fields.Date3 && !cage.fields.Date4) {
      cage['statusId'] = 5;
      cage['location'] = 'Polymer processors';
    } else if (cage.fields.ToLocalProcessing && !cage.fields.FromLocalProcessing) {
      cage['statusId'] = 4;
      cage['location'] = 'Local processor';
    } else if ((cage.fields.Date2) && !(cage.fields.Date3)) {
      cage['statusId'] = 3;
      cage['location'] = cage.fields.Branch;
    } else if (cage.fields.Date1 && !cage.fields.Date2) {
      cage['statusId'] = 2;
      cage['location'] = cage.fields.Customer;
    } else if (cage.fields.CustomerNumber && !cage.fields.Date1) {
      cage['statusId'] = 1;
      cage['location'] = cage.fields.Depot || cage.fields.Branch;
    } else {
      cage['status'] = cage.fields.Status;
    }
    return cage;
  }

  private getCages(url: string, paginate = false): Observable<Cage[]> {
    this._loadingCages = true;
    this.loading.next(true);
    return this.http.get<{['@odata.nextLink']: string, value: Cage[]}>(url).pipe(
      tap(_ => {
        if (paginate) this._nextPage = _['@odata.nextLink'];
        this._loadingCages = false;
        this.loading.next(false);
      }),
      map(res => res.value.map(cage => this.assignStatus(cage)))
    );
  }

  private updateStatus(id: string, payload: any): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.patch<Cage>(url, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  private updateList(res: Cage): Observable<Cage> {
    const newCage = this.assignStatus(res);
    return this._cagesSubject$.pipe(
      take(1),
      map(_ => {
        const cages = _.map(cage => cage);
        const i = cages.findIndex(cage => cage.id === newCage.id);
        if (i > -1) {
          if (newCage['fields']) cages[i] = newCage
          else cages.splice(i, 1);
        } else {
          if (newCage['fields']) cages.unshift(newCage);
        }
        this._cagesSubject$.next(cages);
        return newCage;
      })
    );
  }

  getFirstPage(filters: Params): BehaviorSubject<Cage[]> {
    this._nextPage = '';
    this._loadingCages = false;
    const url = this.createUrl(filters);
    this.getCages(url, true).subscribe(_ => this._cagesSubject$.next(_));
    return this._cagesSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingCages) return;
    this._cagesSubject$.pipe(
      take(1),
      switchMap(acc => this.getCages(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr]),
      ))
    ).subscribe(_ => this._cagesSubject$.next(_));
  }

  getCageHistory(cageNumber: number, cageType: string): Observable<Cage[]> {
    const fields = ['Customer', 'NetWeight', 'Modified', 'Created', 'Status'];
    let url = this._cageTrackerUrl + `/items?expand=fields(select=${fields.join(',')})&orderby=fields/Created desc&filter=`;
    url += ` fields/CageNumber eq ${cageNumber}`;
    url += ` and fields/AssetType eq '${cageType}'`;
    return this.getCages(url);
  }

  getCage(id: string | null): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.get(url).pipe(map((res: any) => this.assignStatus(res)));
  }

  getAllCustomerCages(custnmbr: string, site = ''): Observable<Cage[]> {
    const fields = ['AssetType', 'CageNumber', 'CageWeight', 'Created', 'Date1', 'Date2', 'Date3', 'Date4', 'GrossWeight', 'Modified', 'NetWeight', 'Site', 'Status', 'ToLocalProcessing', 'FromLocalProcessing'];
    let url = this._cageTrackerUrl + `/items?expand=fields(select=${fields.join(',')})`;
    url += '&orderby=fields/Modified desc';
    url += `&filter=fields/CustomerNumber eq '${this.shared.sanitiseName(custnmbr)}'`;
    if (site) url += `and fields/Site eq '${this.shared.sanitiseName(site)}'`;
    return this.getCages(url);
  }

  getActiveCustomerCages(custnmbr: string, site = '', includeReturned: boolean): Observable<Cage[]> {
    const fields = ['AssetType', 'CageNumber', 'CageWeight', 'Created', 'Branch', 'CustomerNumber', 'Notes', 'Material', 'Date1', 'Date2', 'Date3', 'Date4', 'GrossWeight', 'Modified', 'NetWeight', 'Site', 'Status', 'ToLocalProcessing', 'FromLocalProcessing'];
    let url = this._cageTrackerUrl + `/items?expand=fields(select=${fields.join(',')})&filter=fields/CustomerNumber eq '${this.shared.sanitiseName(custnmbr)}'`;
    if (!includeReturned) url += ` and fields/Date2 eq null`;
    url += ` and fields/Status ne 'Complete'`;
    if (site) url += `and fields/Site eq '${this.shared.sanitiseName(site)}'`;
    return this.getCages(url);
  }

  allocateToCustomer(id: string, custnmbr: string, customerName: string, site: Site | string | null | undefined): Observable<Cage> {
    const fields = {Status: 'Allocated to customer', CustomerNumber: custnmbr, Customer: customerName, Site: ''};
    if (site) fields['Site'] = typeof site === 'string' ? site : site.fields?.Title;
    return this.shared.getBranch().pipe(
      switchMap(_ => this.updateStatus(id, {fields: {...fields, Branch: _}})),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    )
  }

  collectLooseFromCustomer(fields: Partial<Cage['fields']>): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items`;
    fields['Date1'] = new Date();
    fields['Date2'] = new Date();
    fields['Status'] = 'Collected from customer';
    fields['AssetType'] = 'Other';
    const payload = {fields};
    return this.http.post<Cage>(url, payload).pipe(
      switchMap(_ => this.updateList(_))
    );
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

  readyForProcessing(id: string): Observable<Cage> {
    const payload = {fields: {Status: 'Ready for delivery to local processing'}};
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

  collectAndComplete(id: string, where: string): Observable<Cage> {
    const key = where === 'polymer' ? 'Date4' : 'FromLocalProcessing';
    const payload = {fields: {Status: 'Complete', [key]: new Date()}};
    return this.updateStatus(id, payload);
  }

  consolidateMaterial(id: string, branch: string | null, material: number | null, quantity: number): Observable<Cage> {
    return this.getBranchQuantity(branch, material).pipe(
      switchMap(_ => {
        if (_.length === 0) {
          const payload = {fields: {Title: branch, Material: material, Quantity: quantity}};
          const url = this._totalsTrackerUrl + `/items`;
          return this.http.post<BranchTotal>(url, payload)
        } else {
          const item = _[0];
          const payload = {fields: {Quantity: (item.fields.Quantity || 0) + (quantity || 0)}};
          const url = this._totalsTrackerUrl + `/items('${item.id}')`;
          return this.http.patch<BranchTotal>(url, payload);
        }
      }),
      switchMap(_ => {
        const date = new Date();
        const payload = {fields: {Status: 'Complete', Consolidated: date}};
        return this.updateStatus(id, payload);
      })
    );
  }

  undo(id: string, status: string): Observable<Cage> {
    const fields = {} as Cage['fields'];
    switch(status)
    {
    case 'Collected from local processing':
      fields['Status'] = 'Delivered to local processing';
      fields['FromLocalProcessing'] = null;
    break
    case 'Collected from Polymer':
      fields['Status'] = 'Delivered to Polymer';
      fields['Date4'] = null;
    break;
    case 'Delivered to Polymer':
    case 'Delivered to local processing':
    case 'Ready for delivery to local processing':
    case 'Ready for delivery to Polymer':
      fields['Status'] = 'Collected from customer';
      fields['Date3'] = null;
      fields['ToLocalProcessing'] = null;
    break;
    case 'Collected from customer':
      fields['Status'] = 'Delivered to customer';
      fields['Date2'] = null;
    break;
    case 'Delivered to customer':
      fields['Status'] = 'Allocated to customer';
      fields['Date1'] = null;
    break;
    case 'Allocated to customer':
      fields['Status'] = 'Available';
      fields['CustomerNumber'] = null;
      fields['Customer'] = null;
      fields['Site'] = null
    break;
    }
    return this.updateStatus(id, {fields});
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

  setBranch(id: string, branch: string): Observable<Cage> {
    const payload = {fields: {Branch: branch}};
    return this.updateStatus(id, payload).pipe(
      tap(() => this.snackBar.open('Branch updated', '', {duration: 3000})),
    );
  }

  setCageDetails(id: string, cageWeight: number, grossWeight: number, notes: string, material: number | null): Observable<Cage> {
    const payload = {fields: {Notes: notes, CageWeight: cageWeight, GrossWeight: grossWeight, Material: material}};
    return this.updateStatus(id, payload);
  }

  setMaterial(id: string, material: number | null): Observable<Cage> {
    const payload = {fields: {Material: material || null}};
    return this.updateStatus(id, payload).pipe(
      tap(() => this.snackBar.open('Collection material updated', '', {duration: 3000})),
    );
  }

  setDepot(id: string, depot: string): Observable<Cage> {
    const payload = {fields: {Depot: depot, ToDepot: new Date()}};
    return this.updateStatus(id, payload).pipe(
      tap(() => this.snackBar.open('Cage transferred to depot', '', {duration: 3000})),
    );
  }

  removeDepot(id: string): Observable<Cage> {
    const payload = {fields: {Depot: null, ToDepot: null}};
    return this.updateStatus(id, payload).pipe(
      tap(() => this.snackBar.open('Cage removed from depot', '', {duration: 3000})),
    );
  }

  addNewCage(cageNumber: number | string | null | undefined, branch: string, assetType: string, cageWeight: number | string | null | undefined): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items`;
    const payload = {fields: {Status: 'Available', Branch: branch, AssetType: assetType}} as Cage;
    if (cageNumber) payload['fields']['CageNumber'] = +cageNumber;
    if (cageWeight) payload['fields']['CageWeight'] = +cageWeight;
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
    const payload = {fields:
      {Status: 'Available', CustomerNumber: null, Customer: null, Date1: null, Date2: null, Date3: null, Date4: null, GrossWeight: null, Material: null, Notes: null}
    };
    return this.updateStatus(id, payload).pipe(
      tap(() => this.snackBar.open('Cage reset', '', {duration: 3000})),
    );
  }

  dehireCage(id: string): Observable<Cage> {
    const url = this._cageTrackerUrl + `/items('${id}')`;
    return this.http.delete<Cage>(url).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err)),
      tap(() => this.snackBar.open('Cage successfully dehired', '', {duration: 3000})),
      switchMap(() => this.updateList({id} as Cage))
    );
  }

  getAvailableCages(branch = ''): Observable<Cage[]> {
    let url = this._cageTrackerUrl + `/items?expand=fields&filter=fields/Status eq 'Available'`;
    if (branch) url += `and fields/Branch eq '${branch}'`
    url += '&orderby=fields/CageNumber asc';
    return this.getCages(url);
  }

  getBranchQuantity(branch: string | null, material: number | null): Observable<BranchTotal[]> {
    const fields = ['Title', 'Quantity', 'Material'];
    let url = this._totalsTrackerUrl + `/items?expand=fields(select=${fields.join(',')})&filter=`;
    const filters = [];
    if (branch) filters.push(` fields/Title eq '${branch}'`);
    if (material) filters.push(` fields/Material eq ${material}`);
    url += filters.join(' and ')
    return this.http.get<BranchTotal[]>(url).pipe(
      map(_ => _['value'])
    );
  }

  checkCageNumber(cageNumber: string, cageType: string): Observable<Cage> {
    let url = this._cageTrackerUrl + `/items?expand=fields(select=id)&filter=fields/CageNumber eq ${cageNumber} and fields/Status ne 'Complete'`;
    if (cageType) url += ` and fields/AssetType eq '${cageType}'`;
    return this.getCages(url).pipe(map(res => res[0]));
  }

  uniqueCageValidator(assetTypeControl: FormControl): ValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.checkCageNumber(control.value, assetTypeControl.value).pipe(
        map((cage) => (cage ? { cageExists: true, id: cage.id } : null)),
        catchError((err: HttpErrorResponse) => this.handleError(err)),
      );
    };
  }

  handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.error?.message || 'Unknown error';
    this.snackBar.open(message, '', {duration: 3000});
    return throwError(() => new Error(message));
  }
}
