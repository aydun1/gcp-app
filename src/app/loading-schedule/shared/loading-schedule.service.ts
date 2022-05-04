import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoadingSchedule } from './loading-schedule';

@Injectable({
  providedIn: 'root'
})
export class LoadingScheduleService {
  private _listUrl = 'lists/522873e2-892c-4e3f-8764-88975d7bd8d0';
  private _url = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
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
    let url = `${this._url}/items?expand=fields(select=TransportCompany,Driver,Spaces,ArrivalDate,LoadingDate,Destination,Notes)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `fields/Destination eq '${filters['branch']}'`;
        case 'status':
          return `fields/Status eq '${filters['status']}'`;
        default:
          return '';
      }
    }).filter(_ => _);
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
        return this.http.get(`${this._url}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  createLoadingScheduleEntry(v: any): Observable<LoadingSchedule> {
    const fields = {
      LoadingDate: v.LoadingDate,
      ArrivalDate: v.arrivalDate,
      Spaces: v.spaces || null,
      TransportCompany: v.transportCompany,
      Driver: v.driver,
      Destination: v.destination,
      Status: v.status,
      Notes: v.notes
    };
    console.log({fields});
    return this.http.post<LoadingSchedule>(`${this._url}/items`, {fields}).pipe(
      switchMap(_ => this.updateList(_))
    );
  }
}