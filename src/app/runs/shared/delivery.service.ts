import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params } from '@angular/router';

import { BehaviorSubject, catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Customer } from '../../customers/shared/customer';
import { Site } from '../../customers/shared/site';
import { SharedService } from '../../shared.service';
import { Delivery } from './delivery';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private _endpoint = 'https://graph.microsoft.com/v1.0';
  private _siteUrl = 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private _listUrl = 'lists/b8088299-ac55-4e30-9977-4b0b20947b84';
  private _columns$ = new BehaviorSubject<any>(null);
  private _deliveryListUrl = `${this._endpoint}/${this._siteUrl}/${this._listUrl}`;
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
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Sequence,Site,CustomerNumber,CustomerId,Customer)`;

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
      map((res: {value: Delivery[]}) => res.value),
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
        if (i > -1) deliveries[i] = res
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

  createDelivery(title: string, customer: Customer, site: Site, sequence: number): Observable<Delivery> {
    const fields = {
      Title: title,
      Customer: customer.name,
      CustomerNumber: customer.accountnumber,
      CustomerId: customer.accountid,
      Sequence: sequence
    };
    if (site) fields['Site'] = site.fields.Title;
    return this.shared.getBranch().pipe(
      switchMap(_ => this.http.post<Delivery>(`${this._deliveryListUrl}/items`, {fields: {...fields, Branch: _}}).pipe(
        switchMap(_ => this.updateList(_))
      ))
    )
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

  private updateSequence(items: Array<{id: string, index: number}>): Observable<Delivery[]> {
    const headers = {'Content-Type': 'application/json'};
    const requests = [];
    let i = 1;
    items.forEach(_ => {
      let url = `${this._siteUrl}/${this._listUrl}/items/${_['id']}`
      const transferFrom = {fields: {
        Sequence: _['index'],
      }};
      requests.push({id: i += 1, method: 'PATCH', url, headers, body: transferFrom});
    })
    return requests.length ? this.http.post(`${this._endpoint}/$batch`, {requests}).pipe(
      map((_: {responses: Array<Delivery>}) => _.responses.map(r => r['body'])),
      switchMap(_ => this.updateListMulti(_)),
      tap(_ => console.log(_))

    ) : of([] as Delivery[]);
  }
}
