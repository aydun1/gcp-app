import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap, take, tap } from 'rxjs';

import { Pallet } from './pallet';

@Injectable({
  providedIn: 'root'
})
export class PalletsService {
  private dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private palletTrackerUrl = `${this.dataGroupUrl}/38f14082-02e5-4978-bf92-f42be2220166`;
  private interstateTransferUrl = `${this.dataGroupUrl}/1ddbafb6-d803-4db2-a56b-99f131e54a67`;


  private _loadingPallets: boolean;
  private _nextPage: string;
  private _palletsSubject$ = new BehaviorSubject<Pallet[]>([]);

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: any): string {
    const filterKeys = Object.keys(filters);
    let url = `${this.palletTrackerUrl}/items?expand=fields(select=Created,Title,Pallet,In,Out,Change)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'bin':
          return `fields/BinNumber2 eq ${filters.bin}`;
        case 'branch':
          return `fields/Branch eq '${filters.branch}'`;
        case 'status':
          return `fields/Status eq '${filters.status}'`;
        case 'assetType':
          return `fields/AssetType eq '${filters.assetType}'`;
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
    return this.http.post(`${this.palletTrackerUrl}/items`, payload);
  }

  getCustomerPallets(custnmbr: string): Observable<Pallet[]> {
    const url = this.palletTrackerUrl + `/items?expand=fields(select=Title,Pallet,In,Out,Change)&filter=fields/Title eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }

  interstateTransfer(form: any) {
    let url = `${this.interstateTransferUrl}/items`;
    const payload = {fields: {Title: `${form.to}${form.reference}`, Pallet: form.type, From: form.from, To: form.to, Quantity: form.quantity}};
    return this.http.post(url, payload);
  }
}
