import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, forkJoin, lastValueFrom, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { RequestLine } from './request-line';
import { SuggestedItem } from './suggested-item';

@Injectable({
  providedIn: 'root'
})
export class PanListService {
  private _panListLinesUrl = `${environment.endpoint}/${environment.siteUrl}/lists/663d6c19-6869-494f-9759-3583d2f72fea`;
  public loading = new BehaviorSubject<boolean>(false);
  private _requestedsSubject$ = new BehaviorSubject<RequestLine[]>([]);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  getPanList(branch: string): Observable<SuggestedItem[]> {
    return this.http.get<{lines: SuggestedItem[]}>(`${environment.gpEndpoint}/pan?branch=${branch}`).pipe(
      map(_ => _.lines)
    );
  }

  getPanListWithQuantities(branch: string, loadingScheduleId: string, panListId: number): Observable<SuggestedItem[]> {
    return combineLatest([this.getPanList(branch), this.getRequestedQuantities(loadingScheduleId, panListId)]).pipe(
      map(([a, b]) => {
        b.forEach(q => {
          const thisOne = a.find(_ => _.ItemNumber === q.fields.ItemNumber);
          if (thisOne) thisOne['ToTransfer'] = q.fields.Quantity;
        });
        return a;
      })
    )
  }

  getRequestedQuantities(loadingScheduleId: string, panListId: number): Observable<RequestLine[]> {
    this.loading.next(true);
    this._requestedsSubject$.next([]);
    const url = `${this._panListLinesUrl}/items?expand=fields(select=ItemNumber,ItemDescription,Quantity)&filter=fields/Title eq '${loadingScheduleId}' and fields/PanList eq '${panListId}'&orderby=fields/ItemNumber asc`;

    const request = this.http.get<{value: RequestLine[]}>(url).pipe(
      map(res => {
        this.loading.next(false);
        return res.value.filter(_ => _.fields.Quantity > 0);
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading.next(false);
        return of([]);
      })
    );
    lastValueFrom(request).then(_ => this._requestedsSubject$.next(_));
    return this._requestedsSubject$;
  }

  deletePanList(loadingScheduleId: string, panListId: number): Promise<RequestLine[]> {
    const url = `${this._panListLinesUrl}/items?expand=fields(select=ItemNumber,ItemDescription,Quantity)&filter=fields/Title eq '${loadingScheduleId}' and fields/PanList eq '${panListId}'&orderby=fields/ItemNumber asc`;
    const request = this.http.get<{value: RequestLine[]}>(url).pipe(
      startWith({value: []}),
      map(res => res.value.filter(_ => _.fields.Quantity > 0)),
      map(lines => lines.map(_ => this.http.patch<RequestLine>(`${this._panListLinesUrl}/items('${_.id}')`, {fields: {Quantity: 0}}))),
      switchMap(_ => forkJoin(_).pipe(startWith([]))),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of();
      })
    );
    return lastValueFrom(request);
  }

  setRequestedQuantities(quantity: number | null | undefined, itemNumber: string, itemDescription: string | null | undefined, loadingScheduleId: string, panListId: number): Promise<RequestLine> {
    const url = `${this._panListLinesUrl}/items?expand=fields(select=Title)&filter=fields/Title eq '${loadingScheduleId}' and fields/PanList eq '${panListId}' and fields/ItemNumber eq '${itemNumber}'`;
    const req = this.http.get(url).pipe(
      switchMap((res: any) => {
        const matches = res.value as RequestLine[];
        if (matches.length > 0) {
          const id = matches[0].id;
          const fields = {Quantity: quantity};
          return this.http.patch<RequestLine>(`${this._panListLinesUrl}/items('${id}')`, {fields});          
        } else {
          const fields = {ItemNumber: itemNumber, ItemDescription: itemDescription, Quantity: quantity, Title: loadingScheduleId, PanList: panListId}
          console.log(fields)
          return this.http.post<RequestLine>(`${this._panListLinesUrl}/items`, {fields});
        }
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of();
      })
    );
    return lastValueFrom(req);
  }


}