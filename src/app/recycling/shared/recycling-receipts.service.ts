import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, map, Observable, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Receipt } from './receipt';


@Injectable({
  providedIn: 'root'
})
export class RecyclingReceiptsService {
  private _loadingReceipts = false;
  private _nextPage = '';
  private _receiptsSubject$ = new BehaviorSubject<Receipt[]>([]);
  private _listUrl = 'lists/4a8dce10-aec9-4203-bd1e-5eb6bd761d4a';
  private _receiptTrackerUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._receiptTrackerUrl}/items?expand=fields`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `fields/Branch eq '${filters['branch']}'`;
        default:
          return '';
      }
    }).filter(_ => _);

    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/Created desc&top=25`;
    return url;
  }

  private getReceipts(url: string, paginate = false): Observable<Receipt[]> {
    return this.http.get<any>(url).pipe(
      tap(_ => {
        if (paginate) this._nextPage = _[''];
      }),
      map((res: any) => res.value)
    );
  }

  private updateList(res: Receipt): Observable<Receipt> {
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

  getFirstPage(filters: Params): BehaviorSubject<Receipt[]> {
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
    if (!this._nextPage || this._loadingReceipts) return;
    this._loadingReceipts = true;
    this._receiptsSubject$.pipe(
      take(1),
      switchMap(acc => this.getReceipts(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr]),
        tap(() => this._loadingReceipts = false)
      ))
    ).subscribe(_ => this._receiptsSubject$.next(_));
  }

  addNewReceipt(receiptNumber: string, branch: string, netWeight: number | string, date: Date): Observable<Receipt> {
    const url = this._receiptTrackerUrl + `/items`;
    const payload = {fields: {Title: receiptNumber, Branch: branch, NetWeight: netWeight, Date: date}};
    return this.http.post<Receipt>(url, payload).pipe(
      switchMap(_ => this.updateList(_))
    );
  }

}
