import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, firstValueFrom, lastValueFrom, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { GroupByCustomerAddressPipe } from '../../shared/pipes/group-by-customer-address';
import { Customer } from '../../customers/shared/customer';
import { CustomersService } from '../../customers/shared/customers.service';
import { Site } from '../../customers/shared/site';
import { Delivery } from './delivery';
import { Run } from './run';
import { Order } from './order';
import { Address } from '../../customers/shared/address';

interface BatchRes {
  responses: {body: Delivery}[];
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private _runsUrl = 'lists/d1874c62-66bf-4ce0-b177-ff5833de9b20';
  private _runsListUrl = `${environment.endpoint}/${environment.siteUrl}/${this._runsUrl}`;
  private _batchUrl = `${environment.gpEndpoint}/deliveries/batch`;
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);
  private _runsSubject$ = new BehaviorSubject<Run[] | null>(null);
  //private _validBatches = ['FULFILLED', 'RELEASED', 'AWAITING_GNC', 'INTERVENE'];
  private _validBatches = ['UNRELEASED'];
  private recentlyArchived: Array<string> = [];
  public loading = new BehaviorSubject<boolean>(true);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private cutomersService: CustomersService,
    private groupByCustomerAddressPipe: GroupByCustomerAddressPipe
  ) { }

  private createUrl(branch: string, runName: string | null | undefined = undefined): string {
    let url = `${environment.gpEndpoint}/deliveries`;
    const runString = runName ? `${runName}` : '';
    const filters: Array<string> = [];
    if (branch) filters.push(`branch=${branch}`);
    if (runName !== undefined ) filters.push(`run=${runString}`);
    if (filters.length > 0) url += `?${filters.join('&')}`;
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
        const runDeliveries = deliveries.filter(_ => runName ? _.fields.Run === runName : !_.fields.Run);
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
    const requests = items.map(_ => {
      if (_['index'] === null) return {id: _['id'], method: 'DELETE'};
      return {id: _['id'], method: 'PATCH', body: {fields: {Sequence: _['index']}}};
    });
    return this.http.post<BatchRes>(this._batchUrl, {requests}).pipe(
      map(_ => _.responses.map(r => r['body'])),
      switchMap(_ => this.updateListMulti(_))
    );
  }

  private transferRunDeliveries(oldName: string, newName: string): Observable<number | BatchRes> {
    if (oldName === newName) return of(1);
    return this.getDeliveriesByRun(oldName).pipe(
      switchMap(deliveries => {
        const requests = deliveries.map(_ => {
          const payload = {fields: {Run: newName}};
          return {id: _['id'], method: 'PATCH', body: payload};
        });
        return requests.length ? this.http.post<BatchRes>(this._batchUrl, {requests}) : of(1);
      })
    );
  }

  private getDeliveriesByRun(runName: string): Observable<Delivery[]> {
    let url = `${environment.gpEndpoint}/deliveries`;
    const runString = runName ? `${runName}` : '';
    const deliveries = this.shared.getBranch().pipe(
      switchMap(branch => {
        const filter2 = `run=${runString}`;
        const filter3 = `branch=${branch}`;
        url += '?' + [filter2, filter3].join('&');
        return this.http.get(url) as Observable<{value: Delivery[]}>;
      }),
      map(_ => _.value)
    );
    return deliveries;
  }

  private getDeliveriesByAccount(customerNumber: string, runName: string): Observable<Delivery> {
    const url = `${environment.gpEndpoint}/deliveries?customer=${customerNumber}&run=${runName}`;
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
          map(deliveries => {
            return orders.filter(_ => !this._validBatches.includes(_.batchNumber)).filter(_ => !deliveries.map(d => d.fields.OrderNumber).includes(_.sopNumber)).filter(_ => !this.recentlyArchived.includes(_.sopNumber))
          })
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

  reloadRunDeliveries(runName: string | null, branch: string): Promise<Delivery[]> {
    const url = this.createUrl(branch, runName);
    const req = this.http.get<{value: Delivery[]}>(url).pipe(
      map(res => res.value),
      switchMap(res => {
        return this._deliveriesSubject$.pipe(
          take(1),
          map(deliveries => {
            return deliveries.filter(_ => _.fields.Run !== (runName || '')).concat(res).map(obj => res.find(o => o.id === obj.id) || obj).sort((a, b) => (a.fields.Sequence > b.fields.Sequence) ? 1 : -1)
          }),
        );
      }),
      tap(_ => this._deliveriesSubject$.next(_))
    );
    return lastValueFrom(req);
  }

  createDropPartial(run: string | null, customer: Customer, site: Site | null, address: Address | null, notes: string, customerType: string, order: Partial<Order> = {}): Partial<Delivery['fields']> {
    const runName = run || undefined;
    const fields: Partial<Delivery['fields']> = {
      Run: runName as string,
      CustomerName: customer.name,
      CustomerNumber: customer.custNmbr,
      City: order?.city || address?.city,
      State: order?.state || address?.state,
      Postcode: order?.postCode || address?.postcode,
      Address: this.shared.addressFormatter(address || order as Order) || site?.fields.Address || customer.address1_composite
    };
    if (customerType) fields['CustomerType'] = customerType === 'Vendors' ? 'Vendor' : 'Debtor';
    if (notes) fields['Notes'] = notes;
    if (site?.fields.Title) fields['Site'] = site.fields.Title;
    if (order.cntPrsn || address?.contact) fields['ContactPerson'] = order.cntPrsn || address?.contact;
    //if (order.reqShipDate) fields['DeliveryDate'] = order.reqShipDate;
    if (order.sopNumber) fields['OrderNumber'] = order.sopNumber;
    if (order.palletSpaces) fields['Spaces'] = order.palletSpaces;
    if (order.orderWeight) fields['Weight'] = order.orderWeight;
    if (order.phoneNumber1 || order.phoneNumber2 || address?.phoneNumber1 || address?.phoneNumber2) fields['PhoneNumber'] = [order.phoneNumber1, order.phoneNumber2, address?.phoneNumber1, address?.phoneNumber2].filter(_ => _).join(',');
    if (order.note) fields['Notes'] = order.note;

    return fields;
  }

  addDrop(deliveryFields: Partial<Delivery['fields']>, targetIndex: number | undefined): Observable<Delivery[]> {
    deliveryFields['Run'] = deliveryFields['Run'] || '';
    deliveryFields['Created'] = new Date();
    deliveryFields['Creator'] = this.shared.getName();
    if (['Pickups', 'Recycling'].includes(deliveryFields.Run || '')) deliveryFields['DeliveryType'] = deliveryFields.Run;
    let backup: Delivery[];
    return this._deliveriesSubject$.pipe(
      take(1),
      tap(deliveries => {
        backup = [...deliveries];
        const runDeliveries = deliveries.filter(_ => _.fields.Run === deliveryFields.Run);
        targetIndex = targetIndex !== undefined ? targetIndex : runDeliveries.findIndex(_ => _.fields.Postcode > (deliveryFields?.Postcode ? deliveryFields.Postcode : ''));
        const insertBeforeId = runDeliveries[targetIndex]?.id;
        const insertBeforeIndex = insertBeforeId ? deliveries.findIndex(_ => _.id === insertBeforeId) : deliveries.length;
        deliveries.splice(insertBeforeIndex, 0, {fields: deliveryFields} as Delivery);
        this._deliveriesSubject$.next(deliveries);
      }),
      switchMap(() => this.shared.getBranch()),
      switchMap(_ => this.http.post<Delivery>(`${environment.gpEndpoint}/deliveries`, {fields: {...deliveryFields, Branch: _}})),
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
      switchMap(_ => this.updateRunDeliveries(deliveryFields.Run))
    );
  }

  moveItem(previousIndex: number, currentIndex: number, run: string): Observable<Delivery[]> {
    return this._deliveriesSubject$.pipe(
      take(1),
      tap(deliveries => {
        const runItems = deliveries.filter(_ => run ? _.fields.Run === run : !_.fields.Run);
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

  changeStatuses(ids: Array<string>, currentStatus: string): Promise<Delivery[] | void> {
    const status = currentStatus === 'Complete' ? 'Active' : 'Complete';
    const payload = {fields: {Status: status}};
    const requests = ids.map(id => {
      return {id, method: 'PATCH', body: payload};
    });
    const req = requests.length ? this.http.post<BatchRes>(this._batchUrl, {requests}).pipe(
      map(_ => _.responses.map(r => r['body'])),
      switchMap(_ => this.updateListMulti(_))
    ) : of([] as Delivery[]);
    return lastValueFrom(req).catch(
      _ => {
        this.updateListMulti([])
        this.snackBar.open(_.error?.result || 'An error occured', '', {duration: 3000});
        console.log(_.error?.result || 'An error occured')
      }
    );
  }

  updateDelivery(id: string, notes: string, requestedDate: Date | null | undefined): Promise<Delivery[]> {
    const requests = [id].map(id => {
      const payload = {fields: {Notes: notes, RequestedDate: requestedDate || null}};
      return {id, method: 'PATCH', body: payload};
    });
    const req = this.http.post<BatchRes>(this._batchUrl, {requests}).pipe(
      map(_ => _.responses.map(r => r['body'])),
      tap(_ => this.recentlyArchived.push(..._.map(r => r.fields.OrderNumber))),
      switchMap(_ => this.updateListMulti(_))
    );
    return lastValueFrom(req);
  }

  deleteDeliveries(ids: Array<string>, run: string): Promise<Delivery[]> {
    const requests = ids.map(id => {
      return {id, method: 'DELETE'};
    });
    const req = this.http.post<BatchRes>(this._batchUrl, {requests}).pipe(
      switchMap(_ => this.removeItemsFromList(ids)),
      switchMap(_ => this.updateRunDeliveries(run))
    );
    return lastValueFrom(req);
  }

  archiveDeliveries(ids: Array<string>, run: string): Promise<Delivery[]> {
    const requests = ids.map(id => {
      const payload = {fields: {Status: 'Archived'}};
      if (!payload['fields']['DeliveryDate']) payload['fields']['DeliveryDate'] = new Date();
      return {id, method: 'PATCH', body: payload};
    });
    const req = this.http.post<BatchRes>(this._batchUrl, {requests}).pipe(
      map(_ => _.responses.map(r => r['body'])),
      tap(_ => this.recentlyArchived.push(..._.map(r => r.fields.OrderNumber))),
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

  tickDeliveriesByRun(runName: string, check: boolean): Promise<Delivery[] | void> {
    const req = this.getDeliveriesByRun(runName).pipe(
      map(_ => _.map(run => run.id)),
      switchMap(_ => this.changeStatuses(_, check ? 'Active' : 'Complete'))
    );
    return firstValueFrom(req);
  }

  moveDeliveries(ids: Array<string>, run: string | null, targetRun: string): Promise<Delivery[]> {
    const req = this._deliveriesSubject$.pipe(
      take(1),
      map(deliveries => deliveries.filter(_ => targetRun ? _.fields.Run === targetRun : !_.fields.Run).length),
      switchMap(_ => {
        const body = {fields: {Run: targetRun, Sequence: _}};
        const requests = ids.map(id => {
          return {id, method: 'PATCH', body};
        });
        return requests.length ? this.http.post<BatchRes>(this._batchUrl, {requests}).pipe(
          map(_ => _.responses.map(r => r['body'])),
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
        if (delivery) {
          const notes = delivery.fields.Notes ? `${delivery.fields.Notes}<br>${message}` : message;
          return this.updateDelivery(delivery.id, notes, null);
         } else {
          const delivery = this.createDropPartial(runName, customer, site, null, message, 'Debtor');
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
