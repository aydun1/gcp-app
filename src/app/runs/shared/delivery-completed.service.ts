import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, lastValueFrom, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Delivery } from './delivery';

interface BatchRes {
  responses: {body: Delivery}[];
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryCompletedService {
  private _batchUrl = `${environment.gpEndpoint}/deliveries/batch`;
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);

  public loading = new BehaviorSubject<boolean>(true);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  private createUrl(branch: string, deliveryType: string, runName: string | null | undefined, orderNumber: string | undefined): string {
    let url = `${environment.gpEndpoint}/deliveries`;
    const runString = runName ? `${runName}` : '';
    const filters: Array<string> = [];
    if (deliveryType) filters.push(`deliveryType=${deliveryType}`);
    if (runName !== undefined ) filters.push(`run=${runString}`);
    if (orderNumber !== undefined ) filters.push(`orderNumberQuery=${orderNumber}`);
    if (branch) filters.push(`branch=${branch}`);
    filters.push('status=Archived');
    if (filters.length > 0) url += `?${filters.join('&')}`;
    return url;
  }

  getDeliveries(branch: string, deliveryType: string, orderNumber = undefined): BehaviorSubject<Delivery[]> {
    const url = this.createUrl(branch, deliveryType, undefined, orderNumber);
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

  changeStatuses(ids: Array<string>, currentStatus: number): Promise<Delivery[] | void> {
    const status = !currentStatus ? 1 : 0;
    const payload = {fields: {PickStatus: status}};
    const requests = ids.map(id => {
      return {id, method: 'PATCH', body: payload};
    });

    const req = requests.length ? this.http.post<BatchRes>(this._batchUrl, {requests}).pipe(
      map(_ => _.responses.map(r => r['body'])),
    ) : of([] as Delivery[]);
    return lastValueFrom(req);
  }

}
