import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Customer } from 'src/app/customers/shared/customer';
import { Site } from 'src/app/customers/shared/site';

import { SharedService } from '../../shared.service';
import { Delivery } from './delivery';

interface PalletQuantities {
  Loscam: number,
  Chep: number,
  Plain: number
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private _endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private _deliveriesUrl = 'lists/b8088299-ac55-4e30-9977-4b0b20947b84';
  private _columns$ = new BehaviorSubject<any>(null);
  private _deliveryListUrl = `${this._endpoint}/${this._deliveriesUrl}`;
  private _loadingDeliveries: boolean;
  private _nextPage: string;
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService
  ) { }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Site,CustomerNumber,Customer)`;

    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'from':
          return `fields/From eq '${filters['from']}'`;
        case 'to':
          return `fields/To eq '${filters['to']}'`;
        case 'branch':
          return `fields/Branch eq '${filters['branch']}'`;
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
    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/Created desc&top=25`;
    return url;
  }

  private getDeliveries(url: string, paginate = false): Observable<Delivery[]> {
    this.loading.next(true);
    this._loadingDeliveries = true;
    return this.http.get(url).pipe(
      tap(_ => {
        this._nextPage = paginate ? _['@odata.nextLink'] : this._nextPage;
        this.loading.next(false);
        this._loadingDeliveries = false;
      }),
      map((res: {value: Delivery[]}) => res.value),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading.next(false);
        this._loadingDeliveries = false;
        return of([]);
      })
    );
  }

  private updateList(res: Delivery): Observable<Delivery> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => {
        const pallets = _.map(pallet => pallet);
        const i = pallets.findIndex(pallet => pallet.id === res.id);
        if (i > -1) pallets[i] = res
        else pallets.unshift(res);
        this._deliveriesSubject$.next(pallets);
        return res
      })
    );
  }

  private dateInt(date: Date): string {
    return `${date.getUTCFullYear()}${('00' + (date.getUTCMonth() + 1)).slice(-2)}`;
  }

  getColumns(): any {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get(`${this._deliveryListUrl}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  getFirstPage(filters: Params): BehaviorSubject<Delivery[]> {
    this._nextPage = '';
    this._loadingDeliveries = false;
    const url = this.createUrl(filters);
    this.getDeliveries(url, true).subscribe(_ => this._deliveriesSubject$.next(_));
    return this._deliveriesSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingDeliveries) return null;
    this._deliveriesSubject$.pipe(
      take(1),
      switchMap(acc => this.getDeliveries(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr])
      ))
    ).subscribe(_ => this._deliveriesSubject$.next(_));
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
    return this.http.post(`${this._deliveryListUrl}/items`, payload);
  }

  createDelivery(title: string, customer: Customer, site: Site): Observable<Delivery> {
    const fields = {
      Title: title,
      Customer: customer.name,
      CustomerNumber: customer.accountnumber,
    };
    return this.shared.getBranch().pipe(
      switchMap(_ => this.http.post<Delivery>(`${this._deliveryListUrl}/items`, {fields: {...fields, Branch: _}}).pipe(
        switchMap(_ => this.updateList(_))
      ))
    )
  }


  editInterstatePalletTransferQuantity(id: string, reference: string, loscam: number, chep: number, plain: number): Observable<Delivery> {
    const pallets = [loscam ? 'Loscam' : '', chep ? 'Chep' : '', plain ? 'Plain' : ''].filter(_ => _);
    const pallet = pallets.length > 1 ? 'Mixed' : pallets.length === 1 ? pallets[0] : 'None';
    const payload = {fields: {
      Pallet: pallet,
      Quantity: +loscam + +plain + +chep,
      Loscam: +loscam,
      Chep: +chep,
      Plain: +plain,
      Reference: reference,
      Notify: true,
      Status: 'Edited'
    }};
    return this.http.patch<Delivery>(`${this._deliveryListUrl}/items('${id}')`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

}
