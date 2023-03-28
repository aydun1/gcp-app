import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, lastValueFrom, map, Observable, of, startWith, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { Customer } from '../../customers/shared/customer';
import { CustomersService } from '../../customers/shared/customers.service';
import { Site } from '../../customers/shared/site';
import { Delivery } from './delivery';
import { Run } from './run';
import { Order } from './order';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private _runsUrl = 'lists/d1874c62-66bf-4ce0-b177-ff5833de9b20';
  private _dropsUrl = 'lists/b8088299-ac55-4e30-9977-4b0b20947b84';
  private _runsListUrl = `${environment.endpoint}/${environment.siteUrl}/${this._runsUrl}`;
  private _deliveryListUrl = `${environment.endpoint}/${environment.siteUrl}/${this._dropsUrl}`;
  private _loadingDeliveries!: boolean;
  private _nextPage!: string;
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);
  private _runsSubject$ = new BehaviorSubject<Delivery[]>([]);

  public loading = new BehaviorSubject<boolean>(true);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private cutomersService: CustomersService
  ) { }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Sequence,Site,Address,CustomerNumber,Customer,Status,OrderNumber,Notes)`;
    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `fields/Branch eq '${filters['branch']}'`;
        default:
          return '';
      }
    }).filter(_ => _);
    if (filterKeys.includes('run')) {
      const cleanName = this.shared.sanitiseName(filters['run']);
      parsed.push(`fields/Title eq '${cleanName}'`);
    } else {
      parsed.push(`fields/Title eq null`);
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
        return res;
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

  private updateIndexesFrom(index: number): Observable<Delivery[]> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => _.map((object, i) => {return {id: object.id, index: i + 1}}).slice(index)),
      switchMap(_ => this.updateSequence(_))
    );
  }

  private updateSequence(items: Array<{id: string, index: number}>): Observable<Delivery[]> {
    const headers = {'Content-Type': 'application/json'};
    const requests: Array<{}> = [];
    let i = 1;
    items.forEach(_ => {
      let url = `${environment.siteUrl}/${this._dropsUrl}/items/${_['id']}`
      const payload = {fields: {
        Sequence: _['index'],
      }};
      requests.push({id: i += 1, method: 'PATCH', url, headers, body: payload});
    })
    return requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
      map((_: any) => _.responses.map((r: any) => r['body'])),
      switchMap(_ => this.updateListMulti(_))
    ) : of([] as Delivery[]);
  }

  private transferRunDeliveries(action: Observable<Object>, oldName: string, newName: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};
    return action.pipe(
      switchMap(() => this.getDeliveriesByRun(oldName)),
      switchMap(deliveries => {
        const requests = [] as Array<{id: number, method: string, url: string, headers: any, body: any}>;
        let i = 1;
        deliveries.forEach(_ => {
          let url = `${environment.siteUrl}/${this._dropsUrl}/items/${_['id']}`
          const payload = {fields: {
            Title: newName
          }};
          requests.push({id: i += 1, method: 'PATCH', url, headers, body: payload});
        })
        return requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}) : of(1);
      })
    );
  }

  syncOrders(branch: string): Observable<Order[]> {
    const request = this.http.get<{orders: Order[]}>(`${environment.gpEndpoint}/orders?branch=${branch}`).pipe(
      map(_ => _.orders),
      switchMap(orders => {
        return this._deliveriesSubject$.pipe(
          map(deliveries => orders.filter(_ => !deliveries.map(d => d.fields.OrderNumber).includes(_.sopNumber)))
        )
      })
    );
    return request;
  }

  getRuns(branch: string): Observable<Run[]> {
    const url = `${this._runsListUrl}/items?expand=fields(select=Title)&filter=fields/Branch eq '${branch}'`;
    return this.http.get(url).pipe(
      startWith(this._runsSubject$),
      map((res: any) => res.value as Delivery[]),
      distinctUntilChanged((prev, curr) => {
        return prev.map(_ => _.fields.Title).join('') === curr.map(_ => _.fields.Title).join('')
      }),
      tap(_ => this._runsSubject$.next(_)),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of([]);
      })
    );
  }

  addRun(run: string): Observable<Run> {
    const url = `${this._runsListUrl}/items`;
    return this.shared.getBranch().pipe(
      switchMap(_ => this.http.post<Run>(url, {fields: {Title: run, Branch: _}}))
    );
  }

  deleteRun(runId: string, oldName: string): Observable<Object> {
    const url = `${this._runsListUrl}/items('${runId}')`
    const action = this.http.delete(url);
    return this.transferRunDeliveries(action, oldName, '');
  }

  renameRun(runId: string, newName: string, oldName: string): Observable<Object> {
    const payload = {fields: {
      Title: newName,
    }};
    const action = this.http.patch(`${this._runsListUrl}/items('${runId}')`, payload);
    return this.transferRunDeliveries(action, oldName, newName);
  }

  getDeliveriesByRun(runName: string): Observable<Delivery[]> {
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Notes)&filter=`;
    const deliveries = this.shared.getBranch().pipe(
      switchMap(branch => {
        const filter2 = `fields/Title eq '${runName}'`;
        const filter3 = `fields/Branch eq '${branch}'`;
        url += [filter2, filter3].join(' and ');
        return this.http.get(url) as Observable<{value: Delivery[]}>;
      }),
      map(_ => _.value)
    );
    return deliveries;
  }

  getDeliveriesByAccount(customerNumber: string, runName: string): Observable<Delivery> {
    const url = `${this._deliveryListUrl}/items?expand=fields(select=Notes)&filter=fields/CustomerNumber eq '${customerNumber}' and fields/Title eq '${runName}'`;
    const deliveries = this.http.get(url) as Observable<{value: Delivery[]}>;
    return deliveries.pipe(
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

  createDelivery(title: string, customer: Customer, site: Site | null, address: string, orderNo: string, notes: string, sequence: number): Observable<Delivery[]> {
    const fields = {Title: title, Customer: customer.name, CustomerNumber: customer.custNmbr, Sequence: sequence, OrderNumber: orderNo};
    if (notes) fields['Notes'] = notes;
    if (site) fields['Site'] = site.fields.Title;
    fields['Address'] = address ? address : site && site.fields.Address ? site.fields.Address : customer.address1_composite;

     return this._deliveriesSubject$.pipe(
      take(1),
      tap(deliveries => {
        deliveries.splice(sequence - 1, 0, {fields: {OrderNumber: orderNo}} as Delivery);
        this._deliveriesSubject$.next(deliveries);
      }),
      switchMap(() => this.shared.getBranch()),
      switchMap(_ => this.http.post<Delivery>(`${this._deliveryListUrl}/items`, {fields: {...fields, Branch: _}})),
      switchMap(d => {
        return this._deliveriesSubject$.pipe(
          take(1),
          tap(deliveries => {
            deliveries.splice(sequence - 1, 1, d);
            this._deliveriesSubject$.next(deliveries);
          })
        );
      }),
      switchMap(_ => {
        const changedItems = _.map((object, i) => {return {id: object.id, index: i + 1}}).slice(sequence - 1);
        return this.updateSequence(changedItems).pipe(
          tap(a => this._deliveriesSubject$.next(a)),
        );
      })
    );
  }

  moveItem(previousIndex: number, currentIndex: number): Observable<Delivery[]> {
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

  requestCageTransfer(runName: string, customerNumber: string, siteName: string, message: string): Observable<Delivery | Delivery[]> {
    this.loading.next(true);
    const delivery = this.getDeliveriesByAccount(customerNumber, runName);
    const cust = this.cutomersService.getCustomer(customerNumber);
    return combineLatest([delivery, cust]).pipe(
      switchMap(([delivery, customer]) => {
        const site = {fields: {Title: siteName}} as Site;
        const address = '';
        if (delivery) {
          const notes = delivery.fields.Notes ? `${delivery.fields.Notes}<br>${message}` : message;
          return this.updateDelivery(delivery.id, notes);
         } else {
          return this.createDelivery(runName, customer, site, address, '', message, 0);
         }
      }),
      tap(_ =>this.snackBar.open('Added to run list', '', {duration: 3000})
      )
    )
  }

  uniqueRunValidator(runs: Array<Run>): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!runs) return null;
      const siteNames = runs.map(_ => _.fields.Title);
      const exists = siteNames.includes(control.value);
      return exists ? {forbiddenName: {value: control.value}} : null;
    };
  }
}
