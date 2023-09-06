import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, firstValueFrom, forkJoin, lastValueFrom, map, Observable, of, startWith, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { GroupByCustomerAddressPipe } from '../../shared/pipes/group-by-customer-address';
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
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);
  private _runsSubject$ = new BehaviorSubject<Run[] | null>(null);
  //private _validBatches = ['FULFILLED', 'RELEASED', 'AWAITING_GNC', 'INTERVENE'];
  private _validBatches = ['UNRELEASED'];

  public loading = new BehaviorSubject<boolean>(true);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private cutomersService: CustomersService,
    private groupByCustomerAddressPipe: GroupByCustomerAddressPipe
  ) { }

  private createUrl(branch: string, runName: string | null | undefined = undefined): string {
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Sequence,Site,City,PostCode,ContactPerson,Address,PhoneNumber,CustomerNumber,Customer,Status,OrderNumber,Notes,Spaces,Weight)`;
    const runString = runName ? `'${runName}'` : 'null';
    const filters: Array<string> = [];
    filters.push('fields/Status ne \'Archived\'');
    if (branch) filters.push(`fields/Branch eq '${branch}'`);
    if (runName !== undefined ) filters.push(`fields/Title eq ${runString}`);
    if (filters.length > 0) url += `&filter=${filters.join(' and ')}`;
    url += `&orderby=fields/Sequence asc&top=2000`;
    return url;
  }

  private updateListMulti(res: Array<Delivery>): Observable<Array<Delivery>> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(_ => _.map(obj => res.filter(_ => _).find(o => o.id === obj.id) || obj).sort((a, b) => (a.fields.Sequence > b.fields.Sequence) ? 1 : -1)),
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

  private updateRunDeliveries(runName: string | null | undefined): Observable<Delivery[]> {
    return this._deliveriesSubject$.pipe(
      take(1),
      map(deliveries => {
        const runDeliveries = deliveries.filter(_ => runName ? _.fields.Title === runName : !_.fields.Title);
        return runDeliveries.map((cur, i) => {
          const duplicated = runDeliveries.find(_ => _.fields['OrderNumber'] === cur.fields['OrderNumber'] && _.id < cur.id);
          if (duplicated && cur.fields['OrderNumber']) return {id: cur.id, index: null, changed: true};
          const prev = runDeliveries[i - 1];
          const next = runDeliveries[i + 1];
          const curIndex = cur.fields.Sequence;
          const prevIndex = prev ? prev.fields.Sequence : -1;
          const nextIndex = next ? next.fields?.Sequence : (cur.fields.Sequence || 0) + 512;
          let newIndex = (curIndex <= prevIndex || curIndex >= nextIndex || !curIndex) ? Math.floor((prevIndex + nextIndex) / 2) : curIndex;
          if (newIndex <= prevIndex || prev?.fields?.CustomerNumber === cur?.fields?.CustomerNumber) newIndex = prevIndex + 1;
          if (!newIndex) newIndex = 1;
          const changed = runDeliveries[i]['fields']['Sequence'] !== newIndex;
          runDeliveries[i]['fields']['Sequence'] = newIndex;
          return {id: cur.id, index: newIndex, changed};
        }).filter(_ => _.changed === true)
      }),
      switchMap(_ => this.updateSequence(_))
    );
  }

  private updateSequence(items: Array<{id: string, index: number | null}>): Observable<Delivery[]> {
    const chunkSize = 20;
    const headers = {'Content-Type': 'application/json'};
    const requests = [...Array(Math.ceil(items.length / chunkSize))].map((_, index) => {
      const list = items.slice(index*chunkSize, index*chunkSize+chunkSize);
      const requests = list.map((_, index) => {
        const url = `${environment.siteUrl}/${this._dropsUrl}/items/${_['id']}`;
        if (_['index'] === null) return {id: index + 1, method: 'DELETE', url, headers};
        const payload = {fields: {Sequence: _['index']}};
        return {id: index + 1, method: 'PATCH', url, headers, body: payload};
      });
      return this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
        map((r: any) => r.responses.map((r: {body: Delivery}) => r['body']))
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

  private getDeliveriesByRun(runName: string): Observable<Delivery[]> {
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Notes)&filter=`;
    const runString = runName ? `'${runName}'` : 'null';
    const deliveries = this.shared.getBranch().pipe(
      switchMap(branch => {
        const filter1 = `fields/Status ne 'Archived'`;
        const filter2 = `fields/Title eq ${runString}`;
        const filter3 = `fields/Branch eq '${branch}'`;
        url += [filter1, filter2, filter3].join(' and ');
        return this.http.get(url) as Observable<{value: Delivery[]}>;
      }),
      map(_ => _.value)
    );
    return deliveries;
  }

  private getDeliveriesByAccount(customerNumber: string, runName: string): Observable<Delivery> {
    const url = `${this._deliveryListUrl}/items?expand=fields(select=Notes)&filter=fields/CustomerNumber eq '${customerNumber}' and fields/Title eq '${runName}'`;
    const deliveries = this.http.get(url) as Observable<{value: Delivery[]}>;
    return deliveries.pipe(
      map(_ => _.value[0])
    );
  }

  syncOrders(branch: string, date: Date): Observable<Order[]> {
    const d = (date).toLocaleString( 'sv', { timeZoneName: 'short' } ).split(' ', 1)[0];
    const request = this.http.get<{orders: Order[]}>(`${environment.gpEndpoint}/orders?branch=${branch}&date=${d}`).pipe(
      map(_ => _.orders),
      switchMap(orders => {
        return this._deliveriesSubject$.pipe(
          map(deliveries => orders.filter(_ => !this._validBatches.includes(_.batchNumber)).filter(_ => !deliveries.map(d => d.fields.OrderNumber).includes(_.sopNumber)))
        )
      })
    );
    return request;
  }

  getOrder(sopType: number, sopNumber: string): Observable<Order> {
    const request = this.http.get<Order>(`${environment.gpEndpoint}/orders/${sopType}/${sopNumber}`);
    return request;
  }

  getRuns(branch: string): Observable<Run[] | null> {
    const url = `${this._runsListUrl}/items?expand=fields(select=Title,Owner)&filter=fields/Branch eq '${branch}'&orderby=fields/Title asc`;
    this.http.get<{value: Run[]}>(url).pipe(
      map(res => res.value),
      distinctUntilChanged((prev, curr) => {
        const before = prev?.sort((a, b) => a.fields.Title > b.fields.Title ? -1 : 1).map(_ => _.fields.Title).join('');
        const after = curr?.sort((a, b) => a.fields.Title > b.fields.Title ? -1 : 1).map(_ => _.fields.Title).join('');
        return before === after;
      }),
      tap(_ => this._runsSubject$.next(_)),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of([]);
      })
    ).subscribe(_ => this._runsSubject$.next(_));
    return this._runsSubject$;
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

  getDeliveries(branch: string): BehaviorSubject<Delivery[]> {
    const url = this.createUrl(branch);
    this.loading.next(true);
    this.http.get<{value: Delivery[]}>(url).pipe(
      tap(_ => this.loading.next(false)),
      map(res => res.value),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading.next(false);
        return of([]);
      })
    ).subscribe(_ => this._deliveriesSubject$.next(_));
    return this._deliveriesSubject$;
  }

  reloadRunDeliveries(runName: string | null, branch: string): Promise<any> {
    const url = this.createUrl(branch, runName);
    const req = this.http.get<{value: Delivery[]}>(url).pipe(
      map(res => res.value),
      switchMap(res => {
        return this._deliveriesSubject$.pipe(
          take(1),
          map(deliveries => {
            return deliveries.filter(_ => _.fields.Title !== (runName || undefined)).concat(res).map(obj => res.find(o => o.id === obj.id) || obj).sort((a, b) => (a.fields.Sequence > b.fields.Sequence) ? 1 : -1)
          }),
        );
      }),
      tap(_ => this._deliveriesSubject$.next(_))
    );
    return lastValueFrom(req);
  }


  createDropPartial(run: string | null, customer: Customer, site: Site | null, address: string, notes: string, order: Partial<Order> = {}): Partial<Delivery['fields']> {
    const runName = run || undefined;
    const fields: Partial<Delivery['fields']> = {Title: runName as string, Customer: customer.name, CustomerNumber: customer.custNmbr};
    if (notes) fields['Notes'] = notes;
    if (site) fields['Site'] = site.fields.Title;
    if (order.cntPrsn) fields['ContactPerson'] = order.cntPrsn;
    if (order.city) fields['City'] = order.city;
    if (order.reqShipDate) fields['DeliveryDate'] = order.reqShipDate;
    if (order.state) fields['State'] = order.state;
    if (order.postCode) fields['PostCode'] = order.postCode;
    if (order.sopNumber) fields['OrderNumber'] = order.sopNumber;
    if (order.palletSpaces) fields['Spaces'] = order.palletSpaces;
    if (order.orderWeight) fields['Weight'] = order.orderWeight;
    if (order.phoneNumber1 || order.phoneNumber2) fields['PhoneNumber'] = [order.phoneNumber1, order.phoneNumber2].filter(_ => _).join(',');
    if (order.note) fields['Notes'] = order.note;
    fields['Address'] = address ? address : site && site.fields.Address ? site.fields.Address : customer.address1_composite;
    return fields;
  }

  addDrop(deliveryFields: Partial<Delivery['fields']>, targetIndex: number | undefined): Observable<Delivery[]> {
    let backup: Delivery[];
    return this._deliveriesSubject$.pipe(
      take(1),
      tap(deliveries => {
        backup = [...deliveries];
        const runDeliveries = deliveries.filter(_ => _.fields.Title === deliveryFields.Title);
        targetIndex = targetIndex !== undefined ? targetIndex : runDeliveries.findIndex(_ => _.fields.PostCode > (deliveryFields?.PostCode ? deliveryFields.PostCode : ''));
        const insertBeforeId = runDeliveries[targetIndex]?.id;
        const insertBeforeIndex = insertBeforeId ? deliveries.findIndex(_ => _.id === insertBeforeId) : deliveries.length;
        deliveries.splice(insertBeforeIndex, 0, {fields: deliveryFields} as Delivery);
        this._deliveriesSubject$.next(deliveries);
      }),
      switchMap(() => this.shared.getBranch()),
      switchMap(_ => this.http.post<Delivery>(`${this._deliveryListUrl}/items`, {fields: {...deliveryFields, Branch: _}})),
      catchError(_ => {
        this._deliveriesSubject$.next(backup);
        throw 'Error';
      }),
      switchMap(delivery => {
        return this._deliveriesSubject$.pipe(
          take(1),
          tap(deliveries => {
            deliveries[deliveries.findIndex(_ => !_.id)] = delivery;
            this._deliveriesSubject$.next(deliveries);
          })
        );
      }),
      switchMap(_ => this.updateRunDeliveries(deliveryFields.Title))
    );
  }

  moveItem(previousIndex: number, currentIndex: number, run: string): Observable<Delivery[]> {
    return this._deliveriesSubject$.pipe(
      take(1),
      tap(deliveries => {
        const runItems = deliveries.filter(_ => run ? _.fields.Title === run : !_.fields.Title);
        const groupedDrops = this.groupByCustomerAddressPipe.transform(runItems).drops;
        const toIndex = currentIndex <= previousIndex ?
        deliveries.findIndex(_ => _.id === groupedDrops[currentIndex].id) :
        deliveries.length - deliveries.slice().reverse().findIndex(_ => _.id === groupedDrops[currentIndex].id) - 1;
        groupedDrops[previousIndex]['value'].forEach((_: Delivery) => {
          const fromIndex = deliveries.findIndex(f => f.id === _.id);
          moveItemInArray(deliveries, fromIndex, toIndex);
        });
        this._deliveriesSubject$.next(deliveries);
      }),
      switchMap(_ => this.updateRunDeliveries(run)),
      tap(_ => this._deliveriesSubject$.next(_))
    )
  }

  changeStatuses(ids: Array<string>, currentStatus: string): Promise<Delivery[]> {
    const headers = {'Content-Type': 'application/json'};
    const status = currentStatus === 'Complete' ? 'Active' : 'Complete';
    const payload = {fields: {Status: status}};
    const requests = ids.map((id, index) => {
      const url = `${environment.siteUrl}/${this._dropsUrl}/items/${id}`;
      return {id: index + 1, method: 'PATCH', url, headers, body: payload};
    });
    const req = requests.length ? this.http.post<{responses: {body: Delivery}[]}>(`${environment.endpoint}/$batch`, {requests}).pipe(
      map(_ => _.responses.map(r => r['body'])),
      switchMap(_ => this.updateListMulti(_))
    ) : of([] as Delivery[]);
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
    const chunkSize = 20;
    const headers = {'Content-Type': 'application/json'};
    const requests = [...Array(Math.ceil(ids.length / chunkSize))].map((_, index) => {
      const list = ids.slice(index*chunkSize, index*chunkSize+chunkSize);
      const requests = list.map((_, index) => {
        const url = `${environment.siteUrl}/${this._dropsUrl}/items/${_}`;
        return {id: index + 1, method: 'DELETE', url, headers};
      });
      return this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
        map((_: any) => _.responses.map((r: any) => r['body']))
      );
    });
    const req = forkJoin([...requests, of([])]).pipe(
      switchMap(_ => this.removeItemsFromList(ids)),
      switchMap(_ => this.updateRunDeliveries(run))
    );
    return lastValueFrom(req);
  }

  archiveDeliveries(ids: Array<string>, run: string): Promise<Delivery[]> {
    const chunkSize = 20;
    const headers = {'Content-Type': 'application/json'};
    const requests = [...Array(Math.ceil(ids.length / chunkSize))].map((_, index) => {
      const list = ids.slice(index*chunkSize, index*chunkSize+chunkSize);
      const requests = list.map((_, index) => {
        const url = `${environment.siteUrl}/${this._dropsUrl}/items/${_}`;
        const payload = {fields: {Status: 'Archived'}};
        return {id: index + 1, method: 'PATCH', url, headers, body: payload};
      });
      return this.http.post(`${environment.endpoint}/$batch`, {requests}).pipe(
        map((_: any) => _.responses.map((r: any) => r['body']))
      );
    });
    const req = forkJoin([...requests, of([])]).pipe(
      switchMap(_ => this.removeItemsFromList(ids)),
      switchMap(_ => this.updateRunDeliveries(run))
    );
    return lastValueFrom(req);
  }

  deleteDeliveriesByRun(runName: string): Promise<Delivery[]> {
    const req = this.getDeliveriesByRun(runName).pipe(
      map(_ => _.map(run => run.id)),
      switchMap(_ => this.deleteDeliveries(_, runName))
    );
    return firstValueFrom(req);
  }

  archiveDeliveriesByRun(runName: string): Promise<Delivery[]> {
    const req = this.getDeliveriesByRun(runName).pipe(
      map(_ => _.map(run => run.id)),
      switchMap(_ => this.archiveDeliveries(_, runName))
    );
    return firstValueFrom(req);
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
          const delivery = this.createDropPartial(runName, customer, site, address, message);
          return this.addDrop(delivery, 0);
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
