import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { Pallet } from './pallet';

@Injectable({
  providedIn: 'root'
})
export class InterstatePalletTransferService {
  private dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private _interstateTransferUrl = `${this.dataGroupUrl}/1ddbafb6-d803-4db2-a56b-99f131e54a67`;
  private _columns$ = new BehaviorSubject<any>(null);
  private _loadingPallets: boolean;
  private _nextPage: string;
  private _palletsSubject$ = new BehaviorSubject<Pallet[]>([]);

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: any): string {
    console.log(filters)
    const filterKeys = Object.keys(filters);
    let url = `${this._interstateTransferUrl}/items?expand=fields(select=Created,Title,Pallet,From,To,Quantity,Approved)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'from':
          return `fields/From eq '${filters.from}'`;
        case 'to':
          return `fields/To eq '${filters.to}'`;
        default:
          return '';
      }
    }).filter(_ => _);

    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/Created desc&top=25`;
    return url;
  }

  private getPallets(url: string, paginate = false): Observable<Pallet[]> {
    return this.http.get(url).pipe(
      tap(_ => this._nextPage = paginate ? _['@odata.nextLink'] : this._nextPage),
      map((res: {value: Pallet[]}) => res.value)
    );
  }

  getColumns() {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get(`${this._interstateTransferUrl}/columns`).pipe(
          map((_: any) => _.value),
          map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  getFirstPage(filters: any): BehaviorSubject<Pallet[]> {
    this._nextPage = '';
    this._loadingPallets = false;
    const url = this.createUrl(filters);
    this.getPallets(url, true).subscribe(_ => this._palletsSubject$.next(_));
    return this._palletsSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingPallets) return null;
    this._loadingPallets = true;
    this._palletsSubject$.pipe(
      take(1),
      switchMap(acc => this.getPallets(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr]),
        tap(() => this._loadingPallets = false)
      ))
    ).subscribe(_ => this._palletsSubject$.next(_));
  }

  addPallets(custnmbr: string, v: any): Observable<any> {
    const payload = {fields: {Title: custnmbr, Pallet: v.palletType, In: v.inQty, Out: v.outQty, Notes: v.notes}};
    return this.http.post(`${this._interstateTransferUrl}/items`, payload);
  }

  getCustomerPallets(custnmbr: string): Observable<Pallet[]> {
    const url = this._interstateTransferUrl + `/items?expand=fields(select=Title,Pallet,In,Out,Change)&filter=fields/Title eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }

  interstateTransfer(form: any) {
    let url = `${this._interstateTransferUrl}/items`;
    const payload = {fields: {Title: `${form.to}${form.reference}`, Pallet: form.type, From: form.from, To: form.to, Quantity: form.quantity}};
    return this.http.post(url, payload);
  }
}
