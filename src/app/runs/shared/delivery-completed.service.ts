import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';

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

  private createUrl(branch: string, runName: string | null | undefined = undefined): string {
    let url = `${this._deliveryListUrl}/items?expand=fields(select=Title,Sequence,Site,City,PostCode,CustomerNumber,Customer,Status,OrderNumber,DeliveryDate)`;
    const runString = runName ? `'${runName}'` : 'null';
    const filters: Array<string> = [];
    filters.push('fields/Status eq \'Archived\'');
    if (branch) filters.push(`fields/Branch eq '${branch}'`);
    if (runName !== undefined ) filters.push(`fields/Title eq ${runString}`);
    if (filters.length > 0) url += `&filter=${filters.join(' and ')}`;
    url += `&orderby=fields/Sequence asc&top=250`;
    return url;
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

}
