import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, lastValueFrom, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoadingSchedule } from './loading-schedule';
import { TransportCompany } from './transport-company';

@Injectable({
  providedIn: 'root'
})
export class LoadingScheduleService {
  private _listUrl = 'lists/522873e2-892c-4e3f-8764-88975d7bd8d0';
  private _transportCompaniesListUrl = 'lists/5bed333e-0bc3-41ae-bda4-b851678347d1';
  private _loadingScheduleUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _transportCompaniesUrl = `${environment.endpoint}/${environment.siteUrl}/${this._transportCompaniesListUrl}`;
  private _nextPage!: string;
  private _loadingScheduleSubject$ = new BehaviorSubject<LoadingSchedule[]>([]);
  private _loadingLoadingSchedule!: boolean;
  private _columns$ = new BehaviorSubject<any>(null);

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
  ) { }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    const params = '?expand=fields(select=TransportCompany,Driver,Spaces,ArrivalDate,LoadingDate,From,To,Status,Notes)&orderby=fields/ArrivalDate asc';
    let url = `${this._loadingScheduleUrl}/items${params}`;
    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `(fields/To eq '${filters['branch']}' or fields/From eq '${filters['branch']}')`;
        case 'status':
          return `fields/Status ${filters['status'] === 'delivered' ? 'eq' : 'ne'} 'Delivered'`;
        default:
          return '';
      }
    }).filter(_ => _);
    if (!filterKeys.includes('status')) parsed.push(`fields/Status ne 'Delivered'`);
    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&top=25`;
    return url;
  }

  private getLoadingSchedule(url: string, paginate = false): Observable<LoadingSchedule[]> {
    this._loadingLoadingSchedule = true;
    this.loading.next(true);
    return this.http.get(url).pipe(
      tap(_ => {
        if (paginate) this._nextPage = _['@odata.nextLink'];
        this._loadingLoadingSchedule = false;
        this.loading.next(false);
      }),
      map((res: any) => res.value)
    );
  }

  private updateList(res: LoadingSchedule): Observable<LoadingSchedule> {
    return this._loadingScheduleSubject$.pipe(
      take(1),
      map(_ => {
        const entries = _.map(pallet => pallet);
        const i = entries.findIndex(pallet => pallet.id === res.id);
        if (i > -1) entries[i] = res
        else entries.push(res);
        this._loadingScheduleSubject$.next(entries);
        return res
      })
    );
  }

  private parseMultiLine(key: string, arrayKey: string, data: any) {
    const arrayData = data['fields'][key]?.split(/[\r\n]+/);
    data['fields'][arrayKey] = arrayData?.map((_: string) => {
      const data = _?.split(',');
      return data.length === 1 ? data[0] : data;
    });
  }

  getFirstPage(filters: Params): BehaviorSubject<LoadingSchedule[]> {
    this._nextPage = '';
    this._loadingLoadingSchedule = false;
    const url = this.createUrl(filters);
    this.getLoadingSchedule(url, true).subscribe(_ => this._loadingScheduleSubject$.next(_));
    return this._loadingScheduleSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingLoadingSchedule) return;
    this._loadingScheduleSubject$.pipe(
      take(1),
      switchMap(acc => this.getLoadingSchedule(this._nextPage).pipe(
        map(curr => [...acc, ...curr])
      ))
    ).subscribe(_ => this._loadingScheduleSubject$.next(_))
  }

  getColumns(): BehaviorSubject<any> {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get(`${this._loadingScheduleUrl}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((acc: any, val: any) => ({ ...acc, [val.name]: val}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  getLoadingScheduleEntry(id: string | null): Observable<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    return this.http.get<LoadingSchedule>(url).pipe(
      tap(_ => this.parseMultiLine('PanLists', 'PanListsArray', _))
    );
  }

  addPanList(id: string): Promise<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    return lastValueFrom(this.getLoadingScheduleEntry(id).pipe(
      switchMap(_ => {
        const pans = _.fields.PanListsArray || [];
        const newId = pans.length > 0 ? parseInt(pans[pans.length - 1][0]) + 1 : 1;
        const fields = {PanLists: [...pans, `${newId},`].join('\r\n')};
        return this.http.patch<LoadingSchedule>(url, {fields});
      }),
      tap(_ => this.parseMultiLine('PanLists', 'PanListsArray', _))
    ));
  }

  removePanList(id: string, panListId: number): Promise<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    return lastValueFrom(this.getLoadingScheduleEntry(id).pipe(
      switchMap(_ => {
        const pans = _.fields.PanListsArray || [];
        const fields = {PanLists: [...pans.filter(p => `${p[0]}` !== `${panListId}`)].join('\r\n')};
        return this.http.patch<LoadingSchedule>(url, {fields});
      }),
      tap(_ => this.parseMultiLine('PanLists', 'PanListsArray', _))
    ));
  }

  getTransportCompanies(branch: string): Observable<TransportCompany[]> {
    const url = `${this._transportCompaniesUrl}/items?expand=fields(select=Title,Drivers)&filter=fields/Branch eq '${branch}'`;
    return this.http.get<{value: TransportCompany[]}>(url).pipe(
      map(res => res.value),
      tap(_ => _.forEach(_ =>  this.parseMultiLine('Drivers', 'DriversArray', _)))
    );
  }

  addTransportCompany(id: string, drivers: string): Observable<TransportCompany> {
    const fields = {Drivers: drivers};
    return this.http.post<TransportCompany>(`${this._transportCompaniesUrl}/items('${id}')`, {fields});
  }

  markDelivered(id: string): Observable<LoadingSchedule> {
    const fields = {Status: 'Delivered'};
    return this.http.patch<LoadingSchedule>(`${this._loadingScheduleUrl}/items('${id}')`, {fields}).pipe(
      switchMap(_ => this.updateList(_)),
    );
  }

  createLoadingScheduleEntry(v: any, id: string | null, branch: string): Observable<LoadingSchedule> {
    const isNewTransportCompany = v.transportCompany && typeof v.transportCompany === 'string' ? true : false;
    const drivers = v.transportCompany?.fields?.Drivers?.split('\n') || [];
    const isNewDriver = v.transportCompany && v.driver && !drivers.includes(v.driver);
    const transportCompany = v.transportCompany?.fields?.Title?.trim() || null;
    const itemsUrl = `${this._transportCompaniesUrl}/items`;
    if (isNewDriver) drivers.push(v.driver);

    const fields = {
      LoadingDate: v.loadingDate,
      ArrivalDate: v.arrivalDate,
      Spaces: v.spaces || null,
      TransportCompany: transportCompany,
      Driver: v.driver,
      From: v.from,
      To: v.to,
      Status: v.status,
      Notes: v.notes
    };

    const a = isNewTransportCompany ?
                this.http.post<TransportCompany>(itemsUrl, {fields: {Title: transportCompany, Drivers: drivers.join('\n'), Branch: branch}}) :
              isNewDriver ? 
                this.http.patch<TransportCompany>(`${itemsUrl}('${v.transportCompany.id}')`, {fields: {Drivers: drivers.join('\n')}}) :
                of({} as TransportCompany);

    const b = id ?
      this.http.patch<LoadingSchedule>(`${this._loadingScheduleUrl}/items('${id}')`, {fields}) :
      this.http.post<LoadingSchedule>(`${this._loadingScheduleUrl}/items`, {fields});

    return a.pipe(
      switchMap(() => b),
      switchMap(_ => this.updateList(_))
    )
  }
}