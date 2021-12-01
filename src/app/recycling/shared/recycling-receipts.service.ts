import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap, take, tap } from 'rxjs';

import { Receipt } from './receipt';


@Injectable({
  providedIn: 'root'
})
export class RecyclingReceiptsService {
  private _loadingReceipts: boolean;
  private _nextPage: string;
  private _receiptsSubject$ = new BehaviorSubject<Receipt[]>([]);
  private _dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private _receiptTrackerUrl = `${this._dataGroupUrl}/4a8dce10-aec9-4203-bd1e-5eb6bd761d4a`;

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: any): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._receiptTrackerUrl}/items?expand=fields`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `fields/Branch eq '${filters.branch}'`;
        default:
          return '';
      }
    }).filter(_ => _);

    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/Created asc&top=25`;
    return url;
  }

  private getReceipts(url: string, paginate = false): Observable<Receipt[]> {
    return this.http.get(url).pipe(
      tap(_ => {
        if (paginate) this._nextPage = _['@odata.nextLink'];
      }),
      map((res: {value: Receipt[]}) => res.value)
    );
  }

  private updateList(res: Receipt) {
    return this._receiptsSubject$.pipe(
      take(1),
      map(_ => {
        const receipts = _.map(cage => cage);
        const i = receipts.findIndex(cage => cage.id === res.id);
        if (i > -1) receipts[i] = res
        else receipts.unshift(res);
        this._receiptsSubject$.next(receipts);
        return res;
      })
    );
  }

  getFirstPage(filters: any): BehaviorSubject<Receipt[]> {
    this._nextPage = '';
    this._loadingReceipts = false;
    const url = this.createUrl(filters);
    this._loadingReceipts = true;
    this.getReceipts(url, true).subscribe(_ => {
      this._receiptsSubject$.next(_);
      this._loadingReceipts = false;
    });
    return this._receiptsSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingReceipts) return null;
    this._loadingReceipts = true;
    this._receiptsSubject$.pipe(
      take(1),
      switchMap(acc => this.getReceipts(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr]),
        tap(() => this._loadingReceipts = false)
      ))
    ).subscribe(_ => this._receiptsSubject$.next(_));
  }

  addNewReceipt(receiptNumber: number, branch: string, netWeight: number, date: Date): Observable<any> {
    const url = this._receiptTrackerUrl + `/items`;
    const payload = {fields: {Title: receiptNumber, Branch: branch, NetWeight: netWeight, Date: date}};
    return this.http.post<Receipt>(url, payload).pipe(
      switchMap(_ => this.updateList(_))
    );
  }

}