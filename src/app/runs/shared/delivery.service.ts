import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, Subject, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { Customer } from '../../customers/shared/customer';
import { CustomersService } from '../../customers/shared/customers.service';
import { Site } from '../../customers/shared/site';
import { Delivery } from './delivery';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private _listUrl = 'lists/b8088299-ac55-4e30-9977-4b0b20947b84';
  private _columns$ = new BehaviorSubject<any>(null);
  private _deliveryListUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _loadingDeliveries!: boolean;
  private _nextPage!: string;
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);

  public loading = new BehaviorSubject<boolean>(true);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private cutomersService: CustomersService
  ) { }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Sequence,Site,Address,CustomerNumber,CustomerId,Customer,Status, Notes)`;

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
    url += `&orderby=fields/Sequence asc&top=25`;
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
      map((res: any) => res.value),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading.next(false);
        this._loadingDeliveries = false;
        return of([]);
      })
    );
  }

  private updateListMulti(res: Array<Delivery>): Observable<Array<Delivery>> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => _.map(obj => res.find(o => o.id === obj.id) || obj).sort((a, b) => (a.fields.Sequence > b.fields.Sequence) ? 1 : -1)),
      tap(_ => this._deliveriesSubject$.next(_))
    );
  }

  private updateList(res: Delivery): Observable<Delivery> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => {
        const deliveries = _.map(delivery => delivery);
        const i = deliveries.findIndex(delivery => delivery.id === res.id);
        if (i > -1) deliveries[i] = res;
        else deliveries.push(res);
        this._deliveriesSubject$.next(deliveries);
        return res
      })
    );
  }

  private removeItemFromList(id: string): Observable<string> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => {
        const deliveries = _.map(delivery => delivery).filter(delivery => delivery.id !== id);
        this._deliveriesSubject$.next(deliveries);
        return id;
      })
    )
  }

  private updateIndexesFrom(index: number) {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => _.map((object, i) => {return {id: object.id, index: i + 1}}).slice(index)),
      switchMap(_ => this.updateSequence(_))
    )
  }

  getColumns(): any {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get(`${this._deliveryListUrl}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((a: any, v: any) => ({ ...a, [v.name]: v}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  getDeliveryByAccount(customerNumber: string) {
    const url = `${this._deliveryListUrl}/items?expand=fields(select=Notes)&filter=fields/CustomerNumber eq '${customerNumber}'`;
    const runs = this.http.get(url) as Observable<{value: Delivery[]}>;
    return runs.pipe(
      map(_ => _.value[0])
    );
  }

  getFirstPage(filters: Params): BehaviorSubject<Delivery[]> {
    this._nextPage = '';
    this._loadingDeliveries = false;
    const url = this.createUrl(filters);
    this.getDeliveries(url, true).subscribe(_ => this._deliveriesSubject$.next(_));
    return this._deliveriesSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingDeliveries) return;
    this._deliveriesSubject$.pipe(
      take(1),
      switchMap(acc => this.getDeliveries(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr])
      ))
    ).subscribe(_ => this._deliveriesSubject$.next(_));
  }

  createDelivery(title: string, customer: Customer, site: Site, notes: string, sequence: number): Observable<Delivery> {
    const fields = {
      Title: title,
      Customer: customer.name,
      CustomerNumber: customer.accountnumber,
      CustomerId: customer.accountid,
      Sequence: sequence
    };
    if (notes) fields['Notes'] = notes;
    if (site) fields['Site'] = site.fields.Title;
    fields['Address'] = site && site.fields.Address ? site.fields.Address : customer.address1_composite;

    return this.shared.getBranch().pipe(
      switchMap(_ => this.http.post<Delivery>(`${this._deliveryListUrl}/items`, {fields: {...fields, Branch: _}}).pipe(
        switchMap(_ => this.updateList(_))
      ))
    )
  }

  changeStatus(id: string, currentStatus: string): Observable<Delivery[]> {
    const status = currentStatus === 'Complete' ? 'Active' : 'Complete';
    const fields = {Status: status};
    return this.http.patch<Delivery>(`${this._deliveryListUrl}/items('${id}')`, {fields}).pipe(
      switchMap(_ => this.updateIndexesFrom(0))
    );
  }

  updateDelivery(id: string, notes: string): Observable<Delivery[]> {
    const fields = {Notes: notes};
    return this.http.patch<Delivery>(`${this._deliveryListUrl}/items('${id}')`, {fields}).pipe(
      switchMap(_ => this.updateIndexesFrom(0))
    );
  }

  deleteDelivery(id: string): Observable<Delivery[]> {
    return this.http.delete<Delivery>(`${this._deliveryListUrl}/items('${id}')`).pipe(
      switchMap(_ => this.removeItemFromList(id)),
      switchMap(_ => this.updateIndexesFrom(0))
    );
  }

  moveItem(previousIndex: number, currentIndex: number) {
    return this._deliveriesSubject$.pipe(
      take(1),
      tap(_ => moveItemInArray(_, previousIndex, currentIndex)),
      tap(_ => this._deliveriesSubject$.next(_)),
      switchMap(_ => {
        const changedFrom = Math.min(previousIndex, currentIndex);
        const changedItems = _.map((object, i) => {return {id: object.id, index: i + 1}}).slice(changedFrom);
        return this.updateSequence(changedItems).pipe(
          tap(a => this._deliveriesSubject$.next(a)),
        );
      })
    )
  }

  requestCageTransfer(customerNumber: string, siteName: string, collect: boolean) {
    this.loading.next(true);
    const run = this.getDeliveryByAccount(customerNumber);
    const cust = this.cutomersService.getCustomerByAccount(customerNumber);
    return combineLatest([run, cust]).pipe(
      switchMap(([run, customer]) => {
        const site = {fields: {Title: siteName}} as Site;
        const message = collect ? 'Cage ready for collection' : 'Cage requested for delivery';
        if (run) {
          const notes = run.fields.Notes ? `${run.fields.Notes}<br>${message}` : message;
          return this.updateDelivery(run.id, notes);
         } else {
          return this.createDelivery('runname', customer, site, message, 0);
         }
      }),
      tap(_ =>this.snackBar.open('Added to run list', '', {duration: 3000})
      )
    )
  }

  private updateSequence(items: Array<{id: string, index: number}>): Observable<Delivery[]> {
    const headers = {'Content-Type': 'application/json'};
    const requests: Array<{}> = [];
    let i = 1;
    items.forEach(_ => {
      let url = `${environment.siteUrl}/${this._listUrl}/items/${_['id']}`
      const transferFrom = {fields: {
        Sequence: _['index'],
      }};
      requests.push({id: i += 1, method: 'PATCH', url, headers, body: transferFrom});
    })
    return requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
      map((_: any) => _.responses.map((r: any) => r['body'])),
      switchMap(_ => this.updateListMulti(_))
    ) : of([] as Delivery[]);
  }
}
