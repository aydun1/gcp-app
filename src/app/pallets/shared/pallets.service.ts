import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { SharedService } from 'src/app/shared.service';
import { Pallet } from './pallet';
import { PalletTotals } from './pallet-totals';

interface PalletQuantities {
  Loscam: number,
  Chep: number,
  Plain: number
}

@Injectable({
  providedIn: 'root'
})
export class PalletsService {
  private endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private palletsUrl = 'lists/38f14082-02e5-4978-bf92-f42be2220166';
  private palletsOwedUrl = 'lists/8ed9913e-a20e-41f1-9a2e-0142c09f2344';
  private _columns$ = new BehaviorSubject<any>(null);
  private palletTrackerUrl = `${this.endpoint}/${this.palletsUrl}`;


  private _loadingPallets: boolean;
  private _nextPage: string;
  private _palletsSubject$ = new BehaviorSubject<Pallet[]>([]);

  constructor(
    private http: HttpClient,
    private shared: SharedService
  ) { }

  private createUrl(filters: any): string {
    const filterKeys = Object.keys(filters);
    let url = `${this.palletTrackerUrl}/items?expand=fields(select=Created,Title,Pallet,In,Out,From,To,Quantity,Reference,Status,Notes,Attachment,Site)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'from':
          return `fields/From eq '${filters.from}'`;
        case 'to':
          return `fields/To eq '${filters.to}'`;
        case 'branch':
          return `(fields/From eq '${filters.branch}' or fields/To eq '${filters.branch}')`;
        case 'name':
          const cleanName = this.shared.sanitiseName(filters.name);
          return `(startswith(fields/CustomerNumber, '${cleanName}') or startswith(fields/Title, '${cleanName}'))`;
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

  private updateList(res: Pallet) {
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

  getFirstPage(filters: Params): BehaviorSubject<Pallet[]> {
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
    const inbound = v.inQty > v.outQty;
    const payload = {fields: {
      Title: v.customerName,
      Branch: v.branch,
      CustomerNumber: v.customer,
      From: inbound ? v.customer : v.branch,
      To: inbound ? v.branch: v.customer,
      In: v.inQty,
      Out: v.outQty,
      Pallet: v.palletType,
      Quantity: Math.abs(v.inQty - v.outQty),
      Notes: v.notes
    }};
    if (v.site) payload['fields']['Site'] = v.site.fields.Title;
    return this.http.post(`${this.palletTrackerUrl}/items`, payload);
  }

  createInterstatePalletTransfer(v: any): Observable<any> {
    const pallets = [v.loscam ? 'Loscam' : '', v.chep ? 'Chep' : '', v.plain ? 'Plain' : ''].filter(_ => _);
    const pallet = pallets.length > 1 ? 'Mixed' : pallets.length === 1 ? pallets[0] : 'None';
    const payload = {fields: {
      From: v.from,
      To: v.to,
      Pallet: pallet,
      Quantity: +v.loscam + +v.plain + +v.chep,
      Loscam: +v.loscam,
      Chep: +v.chep,
      Plain: +v.plain,
      Reference: v.reference,
      Status: 'Pending'
    }};
    return this.http.post<Pallet>(`${this.palletTrackerUrl}/items`, payload).pipe(
      switchMap(_ => this.updateList(_))
    );
  }

  approveInterstatePalletTransfer(id: string, approval: boolean): Observable<any> {
    const payload = {fields: {
      Status: approval ? 'Approved' : 'Rejected'
    }};
    return this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  cancelInterstatePalletTransfer(id: string): Observable<any> {
    const payload = {fields: {Status: 'Cancelled'}};
    return this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  markFileAttached(id: string, status: boolean): Observable<any> {
    const payload = {fields: {Attachment: status}};
    return this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  transferInterstatePalletTransfer(id: string): Observable<any> {
    const payload = {fields: {
      Status: 'Transferred'
    }};
    return this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  editInterstatePalletTransferQuantity(id: string, loscam: number, chep: number, plain: number): Observable<any> {
    const pallets = [loscam ? 'Loscam' : '', chep ? 'Chep' : '', plain ? 'Plain' : ''].filter(_ => _);
    const pallet = pallets.length > 1 ? 'Mixed' : pallets.length === 1 ? pallets[0] : 'None';
    const payload = {fields: {
      Pallet: pallet,
      Quantity: +loscam + +plain + +chep,
      Loscam: +loscam,
      Chep: +chep,
      Plain: +plain
    }};
    return this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  getPalletTransfer(id: string) {
    const url = this.palletTrackerUrl + `/items('${id}')`;
    return this.http.get<Pallet>(url);
  }

  getCustomerPallets(custnmbr: string, site = ''): Observable<Pallet[]> {
    let url = this.palletTrackerUrl + `/items?expand=fields(select=Title,Pallet,Out,In)&filter=fields/CustomerNumber eq '${this.shared.sanitiseName(custnmbr)}'`;
    if (site) url += `and fields/Site eq '${this.shared.sanitiseName(site)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }

  getPalletsOwedToBranch(branch: string, pallet: string, date: Date) {
    const startOfMonth = new Date(Date.UTC(date.getFullYear(), date.getUTCMonth(), 1)).toISOString();
    const dateInt = `${date.getUTCFullYear()}${date.getUTCMonth() + 1}`;
    const eod = new Date(date.setHours(23,59,59,999)).toISOString();

    let url = `${this.endpoint}/${this.palletsOwedUrl}/items?expand=fields(select=Owing)&filter=fields/Branch eq '${branch}' and fields/Pallet eq '${pallet}' and fields/DateInt lt '${dateInt}'&top=2000`;
    let url2 = `${this.palletTrackerUrl}/items?expand=fields(select=In,Out)&filter=fields/Branch eq '${branch}' and fields/Pallet eq '${pallet}' and fields/CustomerNumber ne null and fields/Created ge '${startOfMonth}' and fields/Created lt '${eod}'&top=2000`;

    const prevMonths: Observable<PalletTotals[]> = this.http.get(url).pipe(map((_: any) => _.value));
    const currMonth: Observable<Pallet[]> = this.http.get(url2).pipe(map((_: any) => _.value));

    return combineLatest([prevMonths, currMonth]).pipe(
      map(([pastMonths, thisMonth]) => {
        const count1 = pastMonths.reduce((subtotal, qty) => subtotal + qty.fields.Owing, 0);
        const count2 = thisMonth.reduce((subtotal, qty) => subtotal + qty.fields.Out - qty.fields.In, 0);
        return count1 + count2;
      })
    )
  }

  getPalletsOwedByCustomer(custnmbr: string, site = ''): Observable<PalletQuantities> {
    const date = new Date();
    const startOfMonth = new Date(Date.UTC(date.getFullYear(), date.getUTCMonth(), 1)).toISOString();
    const dateInt = `${date.getUTCFullYear()}${date.getUTCMonth() + 1}`;
    let url = `${this.endpoint}/${this.palletsOwedUrl}/items?expand=fields(select=Title,Pallet,Owing)&filter=fields/Title eq '${this.shared.sanitiseName(custnmbr)}' and fields/DateInt lt '${dateInt}'`;
    let url2 = `${this.palletTrackerUrl}/items?expand=fields(select=Title,Pallet,Out,In)&filter=fields/CustomerNumber eq '${this.shared.sanitiseName(custnmbr)}' and fields/Created ge '${startOfMonth}'`;

    if (site) {
      const filter = `and fields/Site eq '${this.shared.sanitiseName(site)}'`;
      url += filter;
      url2 += filter;
    }

    const currMonth: Observable<Pallet[]> = this.http.get(url2).pipe(map((_: any) => _.value));
    const prevMonths: Observable<PalletTotals[]> = this.http.get(url).pipe(map((_: any) => _.value));

    return combineLatest([prevMonths, currMonth]).pipe(
      map(([pastMonths, thisMonth]) => ['Loscam', 'Chep', 'Plain'].reduce((acc,curr) => {
        const count1 = pastMonths.filter(_ => _.fields.Pallet === curr).reduce((subtotal, qty) => subtotal + qty.fields.Owing, 0);
        const count2 = thisMonth.filter(_ => _.fields.Pallet === curr).reduce((subtotal, qty) => subtotal + qty.fields.Out - qty.fields.In, 0);
        acc[curr] = count1 + count2;
        return acc;
      }, {} as PalletQuantities))
    )
  }

  getInTransitOff(branch: string, pallet: string): Observable<Pallet[]> {
    const melbourneMidnight = new Date(new Date(new Date().toLocaleString('en-US', {timeZone: 'Australia/Melbourne'})).setHours(0,0,0,0)).toISOString();
    let url = this.palletTrackerUrl + '/items?expand=fields(select=Quantity)';
    url += `&filter=fields/From eq '${branch}' and fields/Title eq null and (fields/Pallet eq '${pallet}' or fields/${pallet} gt 0)`;
    url += ` and (fields/Status ne 'Transferred' or (fields/Status eq 'Transferred' and fields/Modified gt '${melbourneMidnight}'))`;
    return this.http.get(url).pipe(map((_: any) => _.value.reduce((acc, val) => acc + (val['fields'][pallet] || val['fields']['Quantity']), 0)));
  }

  getInTransitOn(branch: string, pallet: string): Observable<Pallet[]> {
    const melbourneMidnight = new Date(new Date(new Date().toLocaleString('en-US', {timeZone: 'Australia/Melbourne'})).setHours(0,0,0,0)).toISOString();
    let url = this.palletTrackerUrl + '/items?expand=fields(select=Quantity)';
    url += `&filter=fields/To eq '${branch}' and fields/Title eq null and (fields/Pallet eq '${pallet}' or fields/${pallet} gt 0)`;
    url += ` and (fields/Status eq 'Approved' or (fields/Status eq 'Transferred' and fields/Modified gt '${melbourneMidnight}'))`;
    return this.http.get(url).pipe(map((_: any) => _.value.reduce((acc, val) => acc + (val['fields'][pallet] || val['fields']['Quantity']), 0)));
  }

  getInterstatePalletTransfer(id: string): Observable<{summary: any}> {
    const url = this.palletTrackerUrl + `/items('${id}')/versions`;
    return this.http.get<{value: Pallet[]}>(url).pipe(
      map(_ => {
        const a = _.value.reverse().reduce(
          (acc, curr) => {
            acc['id'] = curr.fields.id;
            if (curr.id === '1.0') {
              acc['initiator'] = curr.lastModifiedBy.user;
              acc['from'] = curr.fields.From;
              acc['to'] = curr.fields.To;
              acc['innitiated'] = curr.lastModifiedDateTime;
              acc['reference'] = curr.fields.Reference;
            }
            if (!acc['approved']) {
              if (curr.fields.Status === 'Approved') {
                acc['approved'] = curr.lastModifiedDateTime;
                acc['approver'] = curr.lastModifiedBy.user;
              } else {
                acc['quantity'] = curr.fields.Quantity;
                acc['loscam'] = curr.fields.Loscam;
                acc['chep'] = curr.fields.Chep;
                acc['plain'] = curr.fields.Plain;
                if (['Loscam', 'Chep', 'Plain'].includes(curr.fields.Pallet)) acc[curr.fields.Pallet.toLowerCase()] = curr.fields.Quantity;
              }
            } else if (!acc['transferred']) {
              if (curr.fields.Status === 'Transferred') {
                acc['transferred'] = curr.lastModifiedDateTime;
                acc['transferer'] = curr.lastModifiedBy.user;
              }
            }

            if (curr.fields.Status === 'Cancelled') {
              acc['cancelled'] = curr.lastModifiedDateTime;
              acc['canceller'] = curr.lastModifiedBy.user;
            } else {
              delete acc['cancelled'];
              delete acc['canceller'];
            }
            return acc;
          }, {versions: _.value.length}
        )
        return {summary: a};
      })
    );
  }
}
