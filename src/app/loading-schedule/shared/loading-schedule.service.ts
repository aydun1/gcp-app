import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, map, Observable, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoadingSchedule } from './loading-schedule';

@Injectable({
  providedIn: 'root'
})
export class LoadingScheduleService {
  private _listUrl = 'lists/1e955039-1d2e-41f8-98a2-688319720410';
  private _url = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _nextPage: string;
  private _loadingScheduleSubject$ = new BehaviorSubject<LoadingSchedule[]>([]);
  private _loadingLoadingSchedule: boolean;

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
  ) { }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._url}/items?expand=fields(select=TransportCompany,Spaces,ArrivalDate,LoadDate)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'bin':
          return `fields/CageNumber eq ${filters['bin']}`;
        case 'branch':
          return `fields/Branch eq '${filters['branch']}'`;
        case 'status':
          if (filters['status'] === 'Polymer') return `fields/Date3 ne null`;
          if (filters['status'] === 'Local processing') return `fields/ToLocalProcessing ne null`;
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
    url += `&$orderby=${filters['sort'] ? filters['sort'] : 'fields/CageNumber'}`;
    url += ` ${filters['order'] ? filters['order'] : 'asc'}`;
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

}