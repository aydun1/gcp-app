import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, firstValueFrom, forkJoin, lastValueFrom, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RequestLine } from './request-line';
import { SuggestedItem } from './suggested-item';

@Injectable({
  providedIn: 'root'
})
export class PanListService {
  private _panListLinesUrl = `${environment.endpoint}/${environment.siteUrl}/lists/663d6c19-6869-494f-9759-3583d2f72fea`;
  private _requestedsSubject$ = new BehaviorSubject<RequestLine[]>([]);
  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  getPanList(branch: string): Promise<SuggestedItem[]> {
    const request = this.http.get<{lines: SuggestedItem[]}>(`${environment.gpEndpoint}/pan?branch=${branch}`).pipe(
      map(_ => _.lines)
    );
    return lastValueFrom(request);
  }

  getPanListWithQuantities(branch: string, loadingScheduleId: string, panListId: number): Observable<SuggestedItem[]> {
    return combineLatest([this.getPanList(branch), this.getRequestedQuantitiesOnce(loadingScheduleId, panListId)]).pipe(
      map(([a, b]) => {
        b.reverse().forEach(requested => {
          const oldIndex = a.findIndex(_ => _.ItemNmbr === requested.fields.ItemNumber);
          let suggestedItem: SuggestedItem;
          if (oldIndex > -1) {
            suggestedItem = a[oldIndex];
            suggestedItem['Notes'] = requested.fields.Notes;
            suggestedItem['ToTransfer'] = requested.fields.Quantity;
            a[oldIndex] = {} as SuggestedItem;
          } else {
            suggestedItem = {
              ItemNmbr: requested.fields.ItemNumber,
              ItemDesc: requested.fields.ItemDescription,
              ToTransfer: requested.fields.Quantity,
              Notes: requested.fields.Notes,
            } as unknown as SuggestedItem;
          }
          a.unshift(suggestedItem);
        });
        return a;
      }),
      switchMap(items => {
        const toFetch = items.filter(_ => !_.Id && _.ItemNmbr).map(
          item => this.searchItems(branch, item.ItemNmbr).then(items => items.find(_ => _.ItemNmbr === item.ItemNmbr))
        );
        return combineLatest([of(items), toFetch.length > 0 ? combineLatest(toFetch) : of([])]);
      }),
      map(([a, b]) => {
        b.forEach(item => {
          const match = a.findIndex(_ => _.ItemNmbr === item?.ItemNmbr);
          a[match] = {...a[match], ...item};
        })
        return a;
      })
    )
  }

  searchItems(branch: string | undefined, searchTerm: string | undefined): Promise<SuggestedItem[]> {
    const s = searchTerm?.trim();
    const request = s ? this.http.get<{lines: SuggestedItem[]}>(`${environment.gpEndpoint}/inventory?branch=${branch}&search=${s}`).pipe(
      map(_ => _.lines)
    ) : of([]);
    return lastValueFrom(request).catch(
      e => {
        console.log(e);
        return [];
      }
    );
  }

  getRequestedQuantitiesOnce(loadingScheduleId: string, panListId: number): Observable<RequestLine[]> {
    const url = `${this._panListLinesUrl}/items?expand=fields(select=ItemNumber,ItemDescription,Quantity, Notes)&filter=fields/Title eq '${loadingScheduleId}' and fields/PanList eq '${panListId}'`;
    return this.http.get<{value: RequestLine[]}>(url).pipe(
      map(res => {
        return res.value.filter(_ => _.fields.Quantity > 0 || _.fields.Notes);
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of([]);
      })
    );
  }

  getRequestedQuantities(loadingScheduleId: string, panListId: number): Observable<RequestLine[]> {
    this.loading.next(true);
    this._requestedsSubject$.next([]);
    const request = this.getRequestedQuantitiesOnce(loadingScheduleId, panListId).pipe(tap(() => this.loading.next(false)));
    lastValueFrom(request).then(_ => this._requestedsSubject$.next(_));
    return this._requestedsSubject$;
  }

  updateQuantitiesSubject(quantity: number | null | undefined, notes: string | null | undefined, itemNumber: string, itemDescription: string | null | undefined): void {
    firstValueFrom(this._requestedsSubject$).then(lines => {
      const match = lines.find(_ => _.fields.ItemNumber === itemNumber);
      if (match) {
        match.fields.Notes = notes || '';
        match.fields.Quantity = quantity || 0;
      } else {
        lines.push({fields: {ItemNumber: itemNumber, ItemDescription: itemDescription, Quantity: quantity || 0, Notes: notes || ''}} as RequestLine);
      }
      this._requestedsSubject$.next(lines.filter(_ => _.fields.Quantity > 0 || _.fields.Notes));
    });
  }

  deletePanList(loadingScheduleId: string, panListId: string): Promise<any> {
    const url = `${this._panListLinesUrl}/items?expand=fields(select=ItemNumber,ItemDescription,Quantity,Notes)&filter=fields/Title eq '${loadingScheduleId}' and fields/PanList eq '${panListId}'&orderby=fields/ItemNumber asc`;
    const request = this.http.get<{value: RequestLine[]}>(url).pipe(
      startWith({value: []}),
      map(res => res.value.filter(_ => _.fields.Quantity > 0 || _.fields.Notes)),
      map(lines => lines.map(_ => this.http.patch<RequestLine>(`${this._panListLinesUrl}/items('${_.id}')`, {fields: {Quantity: 0, Notes: ''}}))),
      switchMap(_ => forkJoin(_).pipe(startWith([]))),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of();
      })
    );
    return lastValueFrom(request);
  }

  setRequestedQuantities(quantity: number | null | undefined, notes: string| null | undefined, itemNumber: string, itemDescription: string | null | undefined, loadingScheduleId: string, panListId: number): Observable<RequestLine> {
    const url = `${this._panListLinesUrl}/items?expand=fields(select=Title)&filter=fields/Title eq '${loadingScheduleId}' and fields/PanList eq '${panListId}' and fields/ItemNumber eq '${itemNumber}'`;
    let query: Observable<RequestLine>;
    return this.http.get(url).pipe(
      switchMap((res: any) => {
        const matches = res.value as RequestLine[];
        if (matches.length > 0) {
          const id = matches[0].id;
          const fields = {Quantity: quantity, Notes: notes};
          query = this.http.patch<RequestLine>(`${this._panListLinesUrl}/items('${id}')`, {fields});
        } else {
          const fields = {ItemNumber: itemNumber, ItemDescription: itemDescription, Quantity: quantity, Notes: notes, Title: loadingScheduleId, PanList: panListId}
          query = this.http.post<RequestLine>(`${this._panListLinesUrl}/items`, {fields});
        }
        return query.pipe(
          tap(_ => this.updateQuantitiesSubject(quantity, notes, itemNumber, itemDescription))
        );
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of();
      })
    );
  }


}