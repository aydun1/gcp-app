import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, forkJoin, lastValueFrom, map, Observable, of, startWith, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { Customer } from '../../customers/shared/customer';
import { CustomersService } from '../../customers/shared/customers.service';
import { Site } from '../../customers/shared/site';
import { Delivery } from './delivery';
import { Run } from './run';
import { Order } from './order';
import { Line } from './line';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private _runsUrl = 'lists/d1874c62-66bf-4ce0-b177-ff5833de9b20';
  private _dropsUrl = 'lists/b8088299-ac55-4e30-9977-4b0b20947b84';
  private _runsListUrl = `${environment.endpoint}/${environment.siteUrl}/${this._runsUrl}`;
  private _deliveryListUrl = `${environment.endpoint}/${environment.siteUrl}/${this._dropsUrl}`;
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);
  private _runsSubject$ = new BehaviorSubject<Delivery[]>([]);
  private _validBatches = ['FULFILLED', 'RELEASED', 'AWAITING_GNC', 'INTERVENE'];

  public loading = new BehaviorSubject<boolean>(true);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private cutomersService: CustomersService
  ) { }

  private createUrl(branch: string): string {
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Sequence,Site,Address,CustomerNumber,Customer,Status,OrderNumber,Notes)`;
    if (branch) url += `&filter=fields/Branch eq '${branch}'`;
    url += `&orderby=fields/Sequence asc&top=2000`;
    return url;
  }

  private updateListMulti(res: Array<Delivery>): Observable<Array<Delivery>> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => _.map(obj => res.find(o => o.id === obj.id) || obj).sort((a, b) => (a.fields.Sequence > b.fields.Sequence) ? 1 : -1)),
      tap(_ => this._deliveriesSubject$.next(_))
    );
  }

  private removeItemsFromList(ids: Array<string>): Observable<Delivery[]> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => {
        const deliveries = _.map(delivery => delivery).filter(delivery => !ids.includes(delivery.id));
        this._deliveriesSubject$.next(deliveries);
        return deliveries;
      })
    )
  }

  private updateRunDeliveries(runName: string | null): Observable<Delivery[]> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(deliveries => deliveries.filter(_ => runName ? _.fields.Title === runName : !_.fields.Title).map(
        (object, i) => {
          return {id: object.id, index: object.fields.Sequence !== i ? i : -1};
        }).filter(_ => _.index > -1)
      ),
      switchMap(_ => this.updateSequence(_))
    );
  }

  private updateSequence(items: Array<{id: string, index: number}>): Observable<Delivery[]> {
    const chunkSize = 20;
    const headers = {'Content-Type': 'application/json'};
    const requests = [...Array(Math.ceil(items.length / chunkSize))].map((_, index) => {
      const list = items.slice(index*chunkSize, index*chunkSize+chunkSize);
      const requests = list.map((_, index) => {
        const url = `${environment.siteUrl}/${this._dropsUrl}/items/${_['id']}`;
        const payload = {fields: {Sequence: _['index']}};
        return {id: index + 1, method: 'PATCH', url, headers, body: payload};
      });
      return this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
        map((r: any) => r.responses.map((r: {body: Delivery}) => r['body']) as Delivery[])
      );
    });
    return (forkJoin([...requests, of([])])).pipe(
      switchMap(_ => this.updateListMulti(_.reduce((acc, cur) => [...acc, ...cur], [])))
    );
  }

  private transferRunDeliveries(oldName: string, newName: string): Observable<any> {
    if (oldName === newName) return of(1);
    const headers = {'Content-Type': 'application/json'};
    return this.getDeliveriesByRun(oldName).pipe(
      switchMap(deliveries => {
        const requests = deliveries.map((_, index) => {
          const url = `${environment.siteUrl}/${this._dropsUrl}/items/${_['id']}`;
          const payload = {fields: {Title: newName}};
          return {id: index + 1, method: 'PATCH', url, headers, body: payload};
        });
        return requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}) : of(1);
      })
    );
  }

  syncOrders(branch: string, date: Date): Observable<Order[]> {
    const d = (date).toLocaleString( 'sv', { timeZoneName: 'short' } ).split(' ', 1)[0];
    const request = this.http.get<{orders: Order[]}>(`${environment.gpEndpoint}/orders?branch=${branch}&date=${d}`).pipe(
      map(_ => _.orders),
      switchMap(orders => {
        return this._deliveriesSubject$.pipe(
          map(deliveries => orders.filter(_ => this._validBatches.includes(_.batchNumber)).filter(_ => !deliveries.map(d => d.fields.OrderNumber).includes(_.sopNumber)))
        )
      })
    );
    return request;
  }

  getOrderLines(sopType: number, sopNumber: string): Observable<Line[]> {
    const request = this.http.get<{lines: Line[]}>(`${environment.gpEndpoint}/orders/${sopType}/${sopNumber}`).pipe(
      map(_ => _.lines)
    );
    return request;
  }

  getRuns(branch: string): Observable<Run[]> {
    const url = `${this._runsListUrl}/items?expand=fields(select=Title,Owner)&filter=fields/Branch eq '${branch}'&orderby=fields/Title asc`;
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
    ) as Observable<Run[]>;
  }

  addRun(run: string, owner: string): Observable<Run> {
    const url = `${this._runsListUrl}/items`;
    return this.shared.getBranch().pipe(
      switchMap(_ => this.http.post<Run>(url, {fields: {Title: run, Branch: _, Owner: owner}}))
    );
  }

  deleteRun(runId: string, oldName: string): Observable<Object> {
    const url = `${this._runsListUrl}/items('${runId}')`
    return this.http.delete(url).pipe(
      switchMap(_ => this.transferRunDeliveries(oldName, ''))
    );
  }

  renameRun(runId: string, newName: string, oldName: string, owner: string): Observable<Object> {
    const fields = {
      Title: newName,
      Owner: owner
    };
    return this.http.patch(`${this._runsListUrl}/items('${runId}')`, {fields}).pipe(
      switchMap(_ => this.transferRunDeliveries(oldName, newName))
    );
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

  getDeliveries(branch: string): BehaviorSubject<Delivery[]> {
    const url = this.createUrl(branch);
    this.loading.next(true);
    this.http.get(url).pipe(
      tap(_ => this.loading.next(false)),
      map((res: any) => res.value),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading.next(false);
        return of([]);
      })
    ).subscribe(_ => this._deliveriesSubject$.next(_));
    return this._deliveriesSubject$;
  }

  createDelivery(run: string | null, customer: Customer, site: Site | null, address: string, city: string, state: string, postcode: string, orderNo: string, notes: string, sequence: number | undefined): Observable<Delivery[]> {
    const runName = run || undefined;
    const fields = {Title: runName, Customer: customer.name, CustomerNumber: customer.custNmbr, OrderNumber: orderNo};
    if (notes) fields['Notes'] = notes;
    if (site) fields['Site'] = site.fields.Title;
    if (city) fields['City'] = city;
    if (state) fields['State'] = state;
    if (postcode) fields['PostCode'] = postcode;
    fields['Address'] = address ? address : site && site.fields.Address ? site.fields.Address : customer.address1_composite;
    return this._deliveriesSubject$.pipe(
      take(1),
      tap(deliveries => {
        sequence = sequence !== undefined ? sequence : deliveries.filter(_ => _.fields.Title === runName).findIndex(_ => _.fields.PostCode > postcode);
        fields['Sequence'] = sequence;
        const targetIndex = deliveries.findIndex(_ => _.fields.Title === runName && _.fields.Sequence === sequence);
        deliveries.splice(targetIndex > -1 ? targetIndex : deliveries.length, 0, {fields: fields} as Delivery);
        this._deliveriesSubject$.next(deliveries);
      }),
      switchMap(() => this.shared.getBranch()),
      switchMap(_ => this.http.post<Delivery>(`${this._deliveryListUrl}/items`, {fields: {...fields, Branch: _}})),
      switchMap(d => {
        return this._deliveriesSubject$.pipe(
          take(1),
          tap(deliveries => {
            const targetIndex = deliveries.findIndex(_ => _.fields.Title === runName && _.fields.Sequence === sequence);
            deliveries.splice(targetIndex, 1, d);
            this._deliveriesSubject$.next(deliveries);
          })
        );
      }),
      switchMap(_ => {
        const changedItems = _.filter(_ =>
          runName ? _.fields.Title === runName : !_.fields.Title
        ).map((object, i) => {
          return {id: object.id, index: i}
        }).slice(sequence);
        return this.updateSequence(changedItems).pipe(
          tap(deliveries => this._deliveriesSubject$.next(deliveries)),
        );
      })
    );
  }

  moveItem(previousIndex: number, currentIndex: number, run: string): Observable<Delivery[]> {
    return this._deliveriesSubject$.pipe(
      take(1),
      tap(deliveries => {
        const runItems = deliveries.filter(_ => run ? _.fields.Title === run : !_.fields.Title);
        const fromIndex = deliveries.findIndex(_ => _.id === runItems[previousIndex].id);
        const toIndex = deliveries.findIndex(_ => _.id === runItems[currentIndex].id);
        moveItemInArray(deliveries, fromIndex, toIndex);
        this._deliveriesSubject$.next(deliveries);
      }),
      switchMap(_ => this.updateRunDeliveries(run)),
      tap(_ => this._deliveriesSubject$.next(_))
    )
  }

  changeStatus(id: string, currentStatus: string): Promise<Delivery[]> {
    const status = currentStatus === 'Complete' ? 'Active' : 'Complete';
    const fields = {Status: status};
    const req = this.http.patch<Delivery>(`${this._deliveryListUrl}/items('${id}')`, {fields}).pipe(
      switchMap(_ => this.updateListMulti([_]))
    );
    return lastValueFrom(req);
  }

  updateDelivery(id: string, notes: string): Promise<Delivery[]> {
    const fields = {Notes: notes};
    const req = this.http.patch<Delivery>(`${this._deliveryListUrl}/items('${id}')`, {fields}).pipe(
      switchMap(_ => this.updateListMulti([_]))
    );
    return lastValueFrom(req);
  }

  deleteDeliveries(ids: Array<string>, run: string): Promise<Delivery[]> {
    const headers = {'Content-Type': 'application/json'};
    const requests = ids.map((id, index) => {
      const url = `${environment.siteUrl}/${this._dropsUrl}/items/${id}`;
      return {id: index + 1, method: 'DELETE', url, headers};
    });
    const req = requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
      map((_: any) => _.responses.map((r: any) => r['body'])),
      switchMap(_ => this.removeItemsFromList(ids)),
      switchMap(_ => this.updateRunDeliveries(run))
    ) : of([] as Delivery[]);
    return lastValueFrom(req);
  }

  moveDeliveries(ids: Array<string>, run: string | null, targetRun: string): Promise<Delivery[]> {
    const headers = {'Content-Type': 'application/json'};
    const req = this._deliveriesSubject$.pipe(
      take(1),
      map(deliveries => deliveries.filter(_ => targetRun ? _.fields.Title === targetRun : !_.fields.Title).length),
      switchMap(_ => {
        const body = {fields: {Title: targetRun, Sequence: _}};
        const requests = ids.map((id, index) => {
          const url = `${environment.siteUrl}/${this._dropsUrl}/items/${id}`;
          return {id: index + 1, method: 'PATCH', url, headers, body};
        });
        return requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
          map((_: any) => _.responses.map((r: any) => r['body'])),
          switchMap(_ => this.updateListMulti(_)),
          switchMap(_ => this.updateRunDeliveries(run))
        ) : of([] as Delivery[]);
      })
    )
    return lastValueFrom(req);
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
          return this.createDelivery(runName, customer, site, address, '', '', '', '', message, 0);
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
