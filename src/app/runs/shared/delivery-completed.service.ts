import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, lastValueFrom, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Delivery } from './delivery';


@Injectable({
  providedIn: 'root'
})
export class DeliveryCompletedService {
  private _dropsUrl = 'lists/b8088299-ac55-4e30-9977-4b0b20947b84';
  private _deliveryListUrl = `${environment.endpoint}/${environment.siteUrl}/${this._dropsUrl}`;
  private _deliveriesSubject$ = new BehaviorSubject<Delivery[]>([]);

  public loading = new BehaviorSubject<boolean>(true);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  private createUrl(branch: string, deliveryType: string, runName: string | null | undefined = undefined): string {
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Sequence,Site,City,PostCode,CustomerNumber,Customer,Status,OrderNumber,DeliveryDate,DeliveryType,Notes,CustomerType,PickStatus)`;
    const runString = runName ? `'${runName}'` : 'null';
    const filters: Array<string> = [];
    if (deliveryType) filters.push(`fields/DeliveryType eq '${deliveryType}'`);
    if (runName !== undefined ) filters.push(`fields/Title eq ${runString}`);
    if (branch) filters.push(`fields/Branch eq '${branch}'`);
    filters.push('fields/Status eq \'Archived\'');
    if (filters.length > 0) url += `&filter=${filters.join(' and ')}`;
    url += `&orderby=fields/DeliveryDate desc&top=250`;
    return url;
  }

  getDeliveries(branch: string, deliveryType: string): BehaviorSubject<Delivery[]> {
    const url = this.createUrl(branch, deliveryType);
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

  changeStatuses(ids: Array<string>, currentStatus: number): void {
    const headers = {'Content-Type': 'application/json'};
    const status = !currentStatus ? 1 : 0;
    const payload = {fields: {PickStatus: status}};
    const requests = ids.map((id, index) => {
      const url = `${environment.siteUrl}/${this._dropsUrl}/items/${id}`;
      return {id: index + 1, method: 'PATCH', url, headers, body: payload};
    });
    lastValueFrom(requests.length ? this.http.post(`${environment.endpoint}/$batch`, {requests}) : of());
  }

}
