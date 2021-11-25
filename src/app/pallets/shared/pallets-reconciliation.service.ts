import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { Reconciliation } from '../shared/reconciliation';

@Injectable({
  providedIn: 'root'
})
export class PalletsReconciliationService {
  private endpoint = 'https://graph.microsoft.com/v1.0';
  private dataGroupUrl = 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists/920f186f-60f2-4c7e-ba8e-855ff2d9c8aa';
  private _columns$ = new BehaviorSubject<any>(null);
  private reconciliationTrackerUrl = `${this.endpoint}/${this.dataGroupUrl}`;


  private _loadingPallets: boolean;
  private _nextPage: string;
  private _palletsSubject$ = new BehaviorSubject<Reconciliation[]>([]);

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: any): string {
    const filterKeys = Object.keys(filters);
    let url = `${this.reconciliationTrackerUrl}/items?expand=fields(select=Created,Title,Pallet,Quantity,Reference,Status)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `(fields/Branch eq '${filters.branch}')`;
        case 'pallet':
          return `fields/Pallet eq '${filters.pallet}'`;
        default:
          return '';
      }
    }).filter(_ => _);
    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/Created desc&top=25`;
    return url;
  }

  private getReconciliations(url: string, paginate = false): Observable<Reconciliation[]> {
    return this.http.get(url).pipe(
      tap(_ => this._nextPage = paginate ? _['@odata.nextLink'] : this._nextPage),
      map((res: {value: Reconciliation[]}) => res.value)
    );
  }

  getFirstPage(filters: Params): BehaviorSubject<Reconciliation[]> {
    this._nextPage = '';
    this._loadingPallets = false;
    const url = this.createUrl(filters);
    this.getReconciliations(url, true).subscribe(_ => this._palletsSubject$.next(_));
    return this._palletsSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingPallets) return null;
    this._loadingPallets = true;
    this._palletsSubject$.pipe(
      take(1),
      switchMap(acc => this.getReconciliations(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr]),
        tap(() => this._loadingPallets = false)
      ))
    ).subscribe(_ => this._palletsSubject$.next(_));
  }

  customerPalletTransfer(v: any): Observable<any> {
    const inbound = v.inQty > v.outQty;
    const payload = {fields: {
      Title: v.customerName,
      From: inbound ? v.customer : v.state,
      To: inbound ? v.state: v.customer,
      In: v.inQty,
      Out: v.outQty,
      Pallet: v.palletType,
      Quantity: Math.abs(v.inQty - v.outQty),
      Notes: v.notes
    }};
    if (v.site) payload['fields']['Site'] = v.site.fields.Title;
    return this.http.post<Reconciliation>(`${this.reconciliationTrackerUrl}/items`, payload).pipe(
      switchMap(res => this.updateList(res))
    );;
  }

  private updateList(res: Reconciliation) {
    return this._palletsSubject$.pipe(
      take(1),
      map(_ => {
        const pallets = _.map(pallet => pallet);
        const i = pallets.findIndex(pallet => pallet.id === res.id);
        if (i > -1) pallets[i] = res
        else pallets.unshift(res);
        this._palletsSubject$.next(pallets);
        return res
      })
    );
  }

  approveInterstatePalletTransfer(id: string, approval: boolean): Observable<any> {
    const payload = {fields: {
      Status: approval ? 'Approved' : 'Rejected',
    }};
    return this.http.patch<Reconciliation>(`${this.reconciliationTrackerUrl}/items('${id}')`, payload)
  }

  getCustomerPallets(custnmbr: string, site = ''): Observable<Reconciliation[]> {
    let url = this.reconciliationTrackerUrl + `/items?expand=fields(select=Title,Pallet,Out,In)&filter=(fields/From eq '${encodeURIComponent(custnmbr)}' or fields/To eq '${encodeURIComponent(custnmbr)}')`;
    if (site) url += `and fields/Site eq '${encodeURIComponent(site)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }

}
