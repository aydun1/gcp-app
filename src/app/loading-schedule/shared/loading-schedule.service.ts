import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap } from 'rxjs';

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
  private _nextPage: string;
  private _loadingScheduleSubject$ = new BehaviorSubject<LoadingSchedule[]>([]);
  private _loadingLoadingSchedule: boolean;
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
      map((res: {value: LoadingSchedule[]}) => res.value)
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

  getFirstPage(filters: Params): BehaviorSubject<LoadingSchedule[]> {
    this._nextPage = '';
    this._loadingLoadingSchedule = false;
    const url = this.createUrl(filters);
    this.getLoadingSchedule(url, true).subscribe(_ => this._loadingScheduleSubject$.next(_));
    return this._loadingScheduleSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingLoadingSchedule) return null;
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
          map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  getLoadingScheduleEntry(id: string): Observable<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    return this.http.get<LoadingSchedule>(url).pipe(
    );
  }

  getTransportCompanies() {
    const url = `${this._transportCompaniesUrl}/items?expand=fields(select=Title,Drivers,Droivers)`;
    return this.http.get(url).pipe(
      map((res: {value: TransportCompany[]}) => res.value),
      tap(_ => console.log(_)),
      tap(_ => _.forEach(_ => _['fields']['DriversArray'] = _['fields']['Drivers']?.split(/[\r\n]+/)))
    );
  }

  addTransportCompany(id: string, drivers: string) {
    const payload = {fields: {
      Drivers: drivers
    }};
    return this.http.post<TransportCompany>(`${this._transportCompaniesUrl}/items('${id}')`, payload);
  }

  markDelivered(id: string) {
    const payload = {fields: {
      Status: 'Delivered'
    }};
    return this.http.patch<LoadingSchedule>(`${this._loadingScheduleUrl}/items('${id}')`, payload).pipe(
      switchMap(_ => this.updateList(_)),
    );
  }

  updateTransportCompanyDrivers(id: string, drivers: string) {
    const payload = {fields: {
      'Drivers': drivers
    }};
    return this.http.patch<TransportCompany>(`${this._transportCompaniesUrl}/items('${id}')`, payload);
  }

  createLoadingScheduleEntry(v: any,id: string): Observable<LoadingSchedule> {
    const drivers = v.transportCompany.fields?.Drivers || [];
    const isNewDriver = !drivers.includes(v.driver) && v.driver !== '';
    const isNewTransportCompany = v.transportCompany.fields ? false : true;
    const transportCompany = isNewTransportCompany ? v.transportCompany : v.transportCompany.fields.Title;

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
    let a = of({} as TransportCompany);
    if (isNewTransportCompany) {
      const fields = {
        Title: transportCompany,
        Drivers: v.driver,
        Branch: v.destination
      };
      a = this.http.post<TransportCompany>(`${this._transportCompaniesUrl}/items`, {fields});
    } else if (isNewDriver) {
      const fields = {
        Drivers: `${drivers}\n${v.driver}`
      };
      a = this.http.patch<TransportCompany>(`${this._transportCompaniesUrl}/items('${v.transportCompany.id}')`, {fields});
    }

    const b = id ?
      this.http.patch<LoadingSchedule>(`${this._loadingScheduleUrl}/items('${id}')`, {fields}):
      this.http.post<LoadingSchedule>(`${this._loadingScheduleUrl}/items`, {fields});


    return a.pipe(
      switchMap(() => 
        b.pipe(
          switchMap(_ => this.updateList(_)),
        )
      )
    )
  }
}