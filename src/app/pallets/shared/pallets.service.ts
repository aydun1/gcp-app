import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { Pallet } from './pallet';

@Injectable({
  providedIn: 'root'
})
export class PalletsService {
  private endpoint = 'https://graph.microsoft.com/v1.0';
  private dataGroupUrl = 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists/38f14082-02e5-4978-bf92-f42be2220166';
  private _columns$ = new BehaviorSubject<any>(null);
  private palletTrackerUrl = `${this.endpoint}/${this.dataGroupUrl}`;


  private _loadingPallets: boolean;
  private _nextPage: string;
  private _palletsSubject$ = new BehaviorSubject<Pallet[]>([]);

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: any): string {
    const filterKeys = Object.keys(filters);
    let url = `${this.palletTrackerUrl}/items?expand=fields(select=Created,Title,Pallet,In,Out,From,To,Quantity,Reference, Status)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'from':
          return `fields/From eq '${filters.from}'`;
        case 'to':
          return `fields/To eq '${filters.to}'`;  
        case 'branch':
          return `fields/From eq '${filters.branch}' or fields/To eq '${filters.branch}'`;
        case 'status':
          return `fields/Status eq '${filters.status}'`;
        case 'pallet':
          return `fields/Pallet eq '${filters.pallet}'`;
        case 'type':
            return `fields/Title eq null`;
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
        return this.http.get(`${this.palletTrackerUrl}/columns`).pipe(
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

  customerPalletTransfer(v: any): Observable<any> {
    console.log(v);
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
    return this.http.post(`${this.palletTrackerUrl}/items`, payload);
  }

  interstatePalletTransfer(v: any): Observable<any> {
    const payload = {fields: {
      From: v.from,
      To: v.to,
      Pallet: v.type,
      Quantity: v.quantity,
      Notes: v.notes,
      Reference: `${v.to}${v.reference}`
    }};
    return this.http.post(`${this.palletTrackerUrl}/items`, payload);
  }

  approveInterstatePalletTransfer(id: string, approval: boolean): Observable<any> {
    const payload = {fields: {
      Status: approval ? 'Approved' : 'Rejected',
    }};
    return this.http.patch(`${this.palletTrackerUrl}/items('${id}')`, payload).pipe(
      map(_ => _ as Pallet),
      switchMap(res => {
        return this._palletsSubject$.pipe(
          take(1),
          map(pallets => pallets.map(pallet => pallet.id === res.id ? res : pallet)),
          tap(_ => this._palletsSubject$.next(_)),
          map(() => res)
        )
      })
    );;
  }

  getCustomerPallets(custnmbr: string): Observable<Pallet[]> {
    const url = this.palletTrackerUrl + `/items?expand=fields(select=Title,Pallet,Out,In)&filter=fields/From eq '${encodeURIComponent(custnmbr)}' or fields/To eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }

  getPalletTransfer(id: string): Observable<any> {
    const url = this.palletTrackerUrl + `/items('${id}')/versions`;
    return this.http.get<{value: Pallet[]}>(url).pipe(
      map(_ => {
        const a = _.value.reverse().reduce(
          (acc, curr) => {
            if (curr.id === '1.0') {
              acc['initiator'] = curr.lastModifiedBy.user;
              acc['pallet'] = curr.fields.Pallet;
              acc['quantity'] = curr.fields.Quantity;
              acc['from'] = curr.fields.From;
              acc['to'] = curr.fields.To;
            }
            if (!acc['approved']) {
              if (curr.fields.Status === "Approved") {
                acc['approved'] = true;
                acc['approver'] = curr.lastModifiedBy.user;
              } else {
                acc['quantity'] = curr.fields.Quantity;
              }
            }
            return acc;
          }, {versions: _.value.length}

        )
        return a
    })
    );
  }
}
