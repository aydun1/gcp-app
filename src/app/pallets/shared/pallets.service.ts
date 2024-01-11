import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { Pallet } from './pallet';
import { PalletTotals } from './pallet-totals';

interface PalletQuantity {
  stateCounts: Array<{name: string, count: number}>;
  states: Array<string>;
  total: number;
  ins: number;
  outs: number;
};

interface PalletQuantities {
  Loscam: PalletQuantity;
  Chep: PalletQuantity;
  GCP: PalletQuantity;
  Plain: PalletQuantity;
  [key: string]: PalletQuantity;
};

interface TransferSummary {
  versions: number;
  id: string;
  reference: string;
  from: string;
  to: string;
  quantity: number | string;
  loscam: number | string;
  chep: number | string;
  plain: number | string;
  gcp: number | string;
  innitiated: string | Date;
  initiator: {displayName: string, email: string, id: string};
  transferred: string | Date;
  transferer: {displayName: string, email: string, id: string};
  approved?: string | Date;
  approver?: {displayName: string, email: string, id: string};
  cancelled?: string | Date;
  canceller?: {displayName: string, email: string, id: string};
};

@Injectable({
  providedIn: 'root'
})
export class PalletsService {
  private _palletListUrl = 'lists/38f14082-02e5-4978-bf92-f42be2220166';
  private _palletsOwedListUrl = 'lists/8ed9913e-a20e-41f1-9a2e-0142c09f2344';
  private _columns$ = new BehaviorSubject<string>('');
  private _palletTrackerUrl = `${environment.endpoint}/${environment.siteUrl}/${this._palletListUrl}`;
  private _palletTrackerOwedUrl = `${environment.endpoint}/${environment.siteUrl}/${this._palletsOwedListUrl}`;
  private _loadingPallets!: boolean;
  private _nextPage!: string;
  private _palletsSubject$ = new BehaviorSubject<Pallet[]>([]);
  private _pallets = this.shared.palletDetails;
  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService
  ) { }

  private createUrl(filters: Params, limit: boolean): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._palletTrackerUrl}/items?expand=fields(select=Date,Title,Pallet,In,Out,From,To,Quantity,Reference,Status,Notes,Attachment,Site,CustomerNumber)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'to':
          return `fields/To eq '${filters['to']}'`;
        case 'status':
          if (filters['status'] === 'Pending') return `(fields/Status eq 'Pending' or fields/Status eq 'Edited')`
          return `fields/Status eq '${filters['status']}'`;
        case 'pallet':
          return `fields/Pallet eq '${filters['pallet']}'`;
        case 'type':
            return `fields/Title eq null`;
        default:
          return '';
      }
    }).filter(_ => _);
    if (filterKeys.includes('name')) {
      const cleanName = this.shared.sanitiseName(filters['name']);
      parsed.push(`(startswith(fields/CustomerNumber, '${cleanName}') or startswith(fields/Title, '${cleanName}'))`);
    }

    if (filterKeys.includes('from')) parsed.push(`fields/From eq '${filters['from']}'`);
    if (filterKeys.includes('branch')) parsed.unshift(`fields/Branch eq '${filters['branch']}'`);
    if (!filterKeys.includes('status')) parsed.push(`fields/Status ne 'Cancelled'`);
    if (limit) {
      const earlier = new Date(new Date().getTime() - 1000*60*60*24*60).toISOString();
      parsed.unshift(`fields/Date ge '${earlier}'`);
  };
    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/Date desc&top=25`;
    return url;
  }

  private getPallets(url: string, paginate = false): Observable<Pallet[]> {
    this.loading.next(true);
    this._loadingPallets = true;
    return this.http.get<{[`@odata.nextLink`]: string}>(url).pipe(
      tap(_ => {
        this._nextPage = paginate ? _['@odata.nextLink'] : this._nextPage;
        this.loading.next(false);
        this._loadingPallets = false;
      }),
      map((res:any) => res.value),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading.next(false);
        this._loadingPallets = false;
        return of([]);
      })
    );
  }

  private updateList(res: Pallet): Observable<Pallet> {
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

  private dateInt(date: Date): number {
    return parseInt(`${date.getUTCFullYear()}${('00' + (date.getUTCMonth() + 1)).slice(-2)}`);
  }

  getColumns(): BehaviorSubject<string> {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get<{value: {name: string}[]}>(`${this._palletTrackerUrl}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((acc: any, val: {name: string}) => ({ ...acc, [val.name]: val}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  getFirstPage(filters: Params, limit: boolean): BehaviorSubject<Pallet[]> {
    this._nextPage = '';
    this._loadingPallets = false;
    const url = this.createUrl(filters, limit);
    this.getPallets(url, true).subscribe(_ => this._palletsSubject$.next(_));
    return this._palletsSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingPallets) return;
    this._palletsSubject$.pipe(
      take(1),
      switchMap(acc => this.getPallets(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr])
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
      Date: v.date,
      Notes: v.notes,
      Site: ''
    }};
    if (v.site) payload['fields']['Site'] = v.site;
    return this.http.post(`${this._palletTrackerUrl}/items`, payload);
  }

  customerPalletTransferMulti(customerName: string, customer: string, branch: string, site: string, date: Date, orderNmbr: string, notes: string, transfers: any): Observable<any> {
    let i = 0;
    const url = `${environment.siteUrl}/${this._palletListUrl}/items`;
    const headers = {'Content-Type': 'application/json'};
    const requests: any = [];
    transfers.filter((_: any) => (_.outQty || 0) > 0 || (_.inQty || 0) > 0)
    .map((v: any) => {
      const inQty = v.inQty || 0;
      const outQty = v.outQty || 0;
      const inbound = inQty > outQty;
      const payload = {fields: {
        Title: customerName,
        Branch: branch,
        CustomerNumber: customer,
        From: inbound ? customer : branch,
        To: inbound ? branch : customer,
        In: inQty,
        Out: outQty,
        Pallet: v.pallet,
        Quantity: Math.abs(inQty - outQty),
        Date: date,
        OrderNumber: orderNmbr,
        Notes: notes,
        Site: ''
      }};
      if (site) payload['fields']['Site'] = site;
      requests.push({id: i += 1, method: 'POST', url, headers, body: payload});
    });
    return requests.length > 0 ? this.http.post(`${environment.endpoint}/$batch`, {requests}) : of(1);
  }

  siteTransfer(custName: string, custNmbr: string, oldSite: string, newSite: string, pallets: PalletQuantities) {
    const url = `${environment.siteUrl}/${this._palletListUrl}/items`;
    const headers = {'Content-Type': 'application/json'};
    const palletCounts = Object.entries(pallets).filter(_ => _[1].total > 0);
    const requests = [] as Array<{id: number, method: string, url: string, headers: any, body: any}>;
    const date = new Date().toISOString();
    let i = 1;
    palletCounts.forEach(palletCount => {
      palletCount[1]['states'].forEach((branch: string) => {
        const quantity = palletCount[1]['stateCounts'][branch];
        const pallet = palletCount[0];
        const transferFrom = {fields: {
          Title: custName,
          Branch: branch,
          CustomerNumber: custNmbr,
          Date: date,
          From: quantity > 0 ? custNmbr : branch,
          To: quantity < 0 ? custNmbr : branch,
          In: quantity > 0 ? quantity : 0,
          Out: quantity < 0 ? Math.abs(quantity) : 0,
          Pallet: pallet,
          Quantity: Math.abs(quantity),
          Notes: 'Site transfer',
          Site: ''
        }};
        if (oldSite) transferFrom['fields']['Site'] = oldSite;
        requests.push({id: i += 1, method: 'POST', url, headers, body: transferFrom});

        const transferTo = {fields: {
          Title: custName,
          Branch: branch,
          CustomerNumber: custNmbr,
          Date: date,
          From: quantity < 0 ? custNmbr : branch,
          To: quantity > 0 ? custNmbr : branch,
          In: quantity < 0 ? Math.abs(quantity) : 0,
          Out: quantity > 0 ? quantity : 0,
          Pallet: pallet,
          Quantity: Math.abs(quantity),
          Notes: 'Site transfer',
          Site: ''
        }};
        if (newSite) transferTo['fields']['Site'] = newSite;
        requests.push({id: i += 1, method: 'POST', url, headers, body: transferTo});
      })
    })
    return requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}) : of(1);
  }

  createInterstatePalletTransfer(v: any): Observable<Pallet> {
    const pallets = this._pallets.map(p => v[p.key] ? p.name : '').filter(_ => _);
    const pallet = pallets.length > 1 ? 'Mixed' : pallets.length === 1 ? pallets[0] : 'None';
    const payload = {fields: {
      From: v.from,
      To: v.to,
      Pallet: pallet,
      Quantity: +v['loscam'] + +v['chep'] + +v['gcp'] + +v['plain'],
      Loscam: +v['loscam'],
      Chep: +v['chep'],
      GCP: +v['gcp'],
      Plain: +v['plain'],
      Date: new Date().toISOString(),
      Reference: v.reference,
      Status: 'Pending',
      Notify: true
    }};
    const action = this.http.post<Pallet>(`${this._palletTrackerUrl}/items`, payload);
    return action.pipe(switchMap(res => this.updateList(res)));
  }

  editInterstatePalletTransferQuantity(id: string, reference: string, v: any): Observable<Pallet> {
    const pallets = this._pallets.map(p => v[p.key] ? p.name : '').filter(_ => _);
    const pallet = pallets.length > 1 ? 'Mixed' : pallets.length === 1 ? pallets[0] : 'None';
    const payload = {fields: {
      Pallet: pallet,
      Quantity: +v['loscam'] + +v['chep'] + +v['gcp'] + +v['plain'],
      Loscam: +v['loscam'],
      Chep: +v['chep'],
      GCP: +v['gcp'],
      Plain: +v['plain'],
      Reference: reference,
      Notify: true,
      Status: 'Edited'
    }};
    const action = this.http.patch<Pallet>(`${this._palletTrackerUrl}/items('${id}')`, payload);
    return action.pipe(switchMap(res => this.updateList(res)));
  }

  approveInterstatePalletTransfer(id: string, approval: boolean): Observable<Pallet> {
    const payload = {fields: {
      Status: approval ? 'Approved' : 'Rejected',
      Notify: true
    }};
    return this.http.patch<Pallet>(`${this._palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  cancelInterstatePalletTransfer(id: string): Observable<Pallet> {
    const payload = {fields: {
      Status: 'Cancelled',
      Notify: true
    }};
    return this.http.patch<Pallet>(`${this._palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  markFileAttached(id: string, status: boolean): Observable<Pallet> {
    const payload = {fields: {
      Attachment: status,
      Notify: false
    }};
    return this.http.patch<Pallet>(`${this._palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  transferInterstatePalletTransfer(id: string): Observable<Pallet> {
    const payload = {fields: {
      Status: 'Transferred',
      Notify: true
    }};
    return this.http.patch<Pallet>(`${this._palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  editInterstatePalletTransferReference(id: string, reference: string): Observable<Pallet> {
    const payload = {fields: {
      Reference: reference,
      Notify: false,
    }};
    return this.http.patch<Pallet>(`${this._palletTrackerUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  getPalletTransfer(id: string | null): Observable<Pallet> {
    const url = this._palletTrackerUrl + `/items('${id}')`;
    return this.http.get<Pallet>(url);
  }

  getCustomerPallets(custNmbr: string, pallet: string, site: string): Observable<Pallet[]> {
    let url = this._palletTrackerUrl + `/items?expand=fields(select=Title,Date,Notes,Pallet,Out,In)&filter=fields/CustomerNumber eq '${this.shared.sanitiseName(custNmbr)}'`;
    if (pallet) url += `and fields/Pallet eq '${pallet}'`;
    if (site) url += `and fields/Site eq '${this.shared.sanitiseName(site)}'`;
    url += `&orderby=fields/Date desc`;
    return this.http.get<{value: Pallet[]}>(url).pipe(map((_) => _['value']));
  }

  getPalletsOwedToBranch(branch: string, pallet: string, date: Date): Observable<number> {
    const startOfMonth = `${date.getFullYear()}-${date.getMonth() + 1}-1`;
    const eod = new Date(date.setHours(23,59,59,999)).toISOString();
    const dateInt = this.dateInt(date);
    const cutoff = this.dateInt(new Date('2022-01-01'));

    const monthsArray: Array<number> = [dateInt];

    while (monthsArray.length < 11 || monthsArray[monthsArray.length - 1] > cutoff) {
      const lastDate = monthsArray[monthsArray?.length - 1].toString(10);
      const year = parseInt(lastDate.slice(0, 4), 10);
      const month = parseInt(lastDate.slice(-2), 10);
      const yearMonth = parseInt(month > 1 ? `${year}${('00' + (month - 1)).slice(-2)}` : `${year - 1}${('0012').slice(-2)}`);
      monthsArray.push(yearMonth);
    }
    monthsArray.shift();
    const previousPalletsUrl = `${this._palletTrackerOwedUrl}/items?expand=fields(select=Owing)&filter=fields/DateInt lt '${monthsArray[monthsArray.length - 1] }' and fields/Branch eq '${branch}' and fields/Pallet eq '${pallet}'&top=2000`;
    const previousPallets$ = this.http.get<{value: PalletTotals[]}>(previousPalletsUrl).pipe(
      map(_ => _['value'].reduce((subtotal, qty) => subtotal + qty.fields.Owing, 0))
    )
    const pastMonthValues$ = monthsArray.map(dateInt => {
      const url = `${this._palletTrackerOwedUrl}/items?expand=fields(select=Owing)&filter=fields/DateInt eq ${dateInt} and fields/Branch eq '${branch}' and fields/Pallet eq '${pallet}'&top=2000`;
      return this.http.get<{value: PalletTotals[]}>(url).pipe(
        map(_ => _['value'].reduce((subtotal, qty) => subtotal + qty.fields.Owing, 0))
      )
    });
    const currentMonthUrl = `${this._palletTrackerUrl}/items?expand=fields(select=In,Out)&filter=fields/Date ge '${startOfMonth}' and fields/Date lt '${eod}' and fields/Branch eq '${branch}' and fields/Pallet eq '${pallet}' and fields/CustomerNumber ne null&top=2000`;
    const currMonth$ = this.http.get<{value:Pallet[]}>(currentMonthUrl).pipe(map(_ => _['value'].reduce((subtotal, qty) => subtotal + qty.fields.Out - qty.fields.In, 0)));

    return combineLatest([previousPallets$, ...pastMonthValues$, currMonth$]).pipe(
      map(_ => _.reduce((acc, val) => acc + val, 0))
    )
  }

  getOrderPallets(orderNmbr: string, pallet: string, site: string): Observable<PalletQuantities> {
    let url = this._palletTrackerUrl + `/items?expand=fields(select=Title,Date,Notes,Pallet,Out,In)&filter=fields/OrderNumber eq '${this.shared.sanitiseName(orderNmbr)}'`;
    if (pallet) url += `and fields/Pallet eq '${pallet}'`;
    if (site) url += `and fields/Site eq '${this.shared.sanitiseName(site)}'`;
    url += `&orderby=fields/Date desc`;
    return this.http.get<{value: Pallet[]}>(url).pipe(map((_) => _['value'])).pipe(
      map((currentMonth) => this.shared.pallets.reduce((acc, pallet) => {
        const currentPallets = Object.values(currentMonth).filter(_ => _.fields.Pallet === pallet).map(_ => {return {branch: _.fields.Branch, outs: _.fields.Out, ins: _.fields.In }});
        const totals: PalletQuantity = currentPallets.reduce((acc, qty) => {
          const total = acc['total'] + qty.outs - qty.ins;
          const ins = acc['ins'] + qty.ins;
          const outs = acc['outs'] + qty.outs;
          return {total, ins, outs} as PalletQuantity;
        }, {stateCounts: [], total: 0, ins: 0, outs: 0, states: [] as Array<string>} as  PalletQuantity);
        acc[pallet as keyof PalletQuantities] = totals;
        return acc;
      }, {} as PalletQuantities))
    );
  }

  getPalletsOwedByCustomer(custnmbr: string, site?: string | undefined): Observable<PalletQuantities> {
    const date = new Date();
    const startOfMonth = `${date.getFullYear()}-${date.getMonth() + 1}-1`;
    const dateInt = this.dateInt(date);
    let url = `${this._palletTrackerOwedUrl}/items?expand=fields(select=Title,Pallet,Owing,Branch)&filter=fields/Title eq '${this.shared.sanitiseName(custnmbr)}' and fields/DateInt lt '${dateInt}'`;
    let url2 = `${this._palletTrackerUrl}/items?expand=fields(select=Title,Pallet,Out,In,Branch)&filter=fields/Date ge '${startOfMonth}' and fields/CustomerNumber eq '${this.shared.sanitiseName(custnmbr)}'`;
    if (site !== undefined) {
      const filter = 'and fields/Site eq ' + (site ? `'${this.shared.sanitiseName(site)}'` : 'null');
      url += filter;
      url2 += filter;
    }

    const currMonth = this.http.get<{value: Pallet[]}>(url2).pipe(map(_ => _['value']));
    const prevMonths = this.http.get<{value: PalletTotals[]}>(url).pipe(map(_ => _['value']));
    return combineLatest([prevMonths, currMonth]).pipe(
      map(([pastMonths, currentMonth]) => this.shared.pallets.reduce((acc, pallet) => {
        const currentPallets = Object.values(currentMonth).filter(_ => _.fields.Pallet === pallet).map(_ => {return {branch: _.fields.Branch, pallets: _.fields.Out - _.fields.In }});
        const pastPallets = Object.values(pastMonths).filter(_ => _.fields.Pallet === pallet).map(_ => {return {branch: _.fields.Branch, pallets: _.fields.Owing || 0 }});
        const totals: PalletQuantity = [...currentPallets, ...pastPallets].reduce((acc, qty) => {
          const stateCounts = {...acc['stateCounts'], [qty.branch]: (acc['stateCounts'][qty.branch as unknown as number] as unknown as number || 0) + qty.pallets};
          const total = acc['total'] + qty.pallets;
          const states = (acc['states'].includes(qty.branch) ? acc['states'] : [...acc['states'], qty.branch]).sort();
          return {stateCounts, total, states} as PalletQuantity;
        }, {stateCounts: [], total: 0, ins: 0, outs: 0, states: [] as Array<string>} as  PalletQuantity);
        acc[pallet as keyof PalletQuantities] = totals;
        return acc;
      }, {} as PalletQuantities))
    )
  }

  getInTransitOff(branch: string, pallet: string): Observable<number> {
    const melbourneMidnight = new Date(new Date(new Date().toLocaleString('en-US', {timeZone: 'Australia/Melbourne'})).setHours(0,0,0,0)).toISOString();
    let url = this._palletTrackerUrl + `/items?expand=fields(select=Quantity,${pallet})&filter=`;
    const filters = [
      `(fields/Status eq 'Pending' or fields/Status eq 'Approved' or (fields/Status eq 'Transferred' and fields/Modified gt '${melbourneMidnight}'))`,
      `(fields/Pallet eq '${pallet}' or fields/${pallet} gt 0)`,
      `fields/From eq '${branch}'`,
      `fields/Title eq null`,
    ];
    url += filters.join(' and ') + '&top=2000';
    return this.http.get<{value: {fields: any}[]}>(url).pipe(
      map(_ => _['value'].reduce((acc, val) => acc + (val['fields'][pallet] || val['fields']['Quantity']), 0))
    );
  }

  getInTransitOn(branch: string, pallet: 'Loscam' | 'Chep' | 'GCP' | 'Plain'): Observable<number> {
    const melbourneMidnight = new Date(new Date(new Date().toLocaleString('en-US', {timeZone: 'Australia/Melbourne'})).setHours(0,0,0,0)).toISOString();
    let url = this._palletTrackerUrl + `/items?expand=fields(select=Quantity,${pallet})&filter=`;

    const filters = [
      `(fields/Status eq 'Approved' or (fields/Status eq 'Transferred' and fields/Modified gt '${melbourneMidnight}'))`,
      `(fields/Pallet eq '${pallet}' or fields/${pallet} gt 0)`,
      `fields/To eq '${branch}'`,
      `fields/Title eq null`,
    ];
    url += filters.join(' and ') + '&top=2000';
    return this.http.get<{value: {fields: {Loscam: number, Chep: number, GCP: number, Plain: number, Quantity: number}}[]}>(url).pipe(
      map(_ => _['value'].reduce((acc, val) => acc + (val['fields'][pallet] || val['fields']['Quantity']), 0))
    );
  }

  getInterstatePalletTransfer(id: string | null): Observable<{summary: any}> {
    const url = this._palletTrackerUrl + `/items('${id}')/versions`;
    return this.http.get<{value: Pallet[]}>(url).pipe(
      map(_ => {
        const a = _.value.reverse().reduce(
          (acc, curr) => {
            acc['id'] = curr.fields.id;
            acc['reference'] = curr.fields.Reference;
            if (curr.id === '1.0') {
              acc['initiator'] = curr.lastModifiedBy.user;
              acc['from'] = curr.fields.From;
              acc['to'] = curr.fields.To;
              acc['innitiated'] = curr.lastModifiedDateTime;
            }
            if (!acc['approved']) {
              if (curr.fields.Status === 'Approved') {
                acc['approved'] = curr.lastModifiedDateTime;
                acc['approver'] = curr.lastModifiedBy.user;
              } else {
                acc['quantity'] = curr.fields.Quantity;
                acc['loscam'] = curr.fields['Loscam'];
                acc['chep'] = curr.fields['Chep'];
                acc['gcp'] = curr.fields['GCP'];
                acc['plain'] = curr.fields['Plain'];
                if (this.shared.pallets.includes(curr.fields.Pallet)) {
                  const pal = curr.fields.Pallet.toLowerCase() as 'loscam' | 'chep' | 'gcp' | 'plain';
                  acc[pal] = curr.fields.Quantity;
              };
              }
            } else if (!acc['transferred']) {
              if (curr.fields.Status === 'Transferred') {
                acc['transferred'] = curr.lastModifiedDateTime;
                acc['transferer'] = curr.lastModifiedBy.user;
              }
            }

            if (curr.fields.Status === 'Edited') {
              delete acc['approved'];
              delete acc['approver'];
              acc['quantity'] = curr.fields.Quantity;
              acc['loscam'] = curr.fields['Loscam'];
              acc['chep'] = curr.fields['Chep'];
              acc['gcp'] = curr.fields['GCP'];
              acc['plain'] = curr.fields['Plain'];
            }

            if (curr.fields.Status === 'Cancelled') {
              delete acc['approved'];
              delete acc['approver'];
              acc['cancelled'] = curr.lastModifiedDateTime;
              acc['canceller'] = curr.lastModifiedBy.user;
            } else {
              delete acc['cancelled'];
              delete acc['canceller'];
            }
            return acc;
          }, {versions: _.value.length} as TransferSummary
        )
        return {summary: a};
      })
    );
  }
}
