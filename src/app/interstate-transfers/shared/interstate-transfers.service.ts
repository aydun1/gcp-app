import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PurchaseOrder } from './purchase-order';
import { PurchaseOrderLine } from './purchase-order-line';
import { RequestLine } from './request-line';
import { SuggestedItem } from './suggested-item';

@Injectable({
  providedIn: 'root'
})
export class InterstateTransfersService {
  private _panListsUrl = `${environment.endpoint}/${environment.siteUrl}/lists/b0c9f745-854d-45f0-b074-f070db6af4e7`;
  private _panListLinesUrl = `${environment.endpoint}/${environment.siteUrl}/lists/663d6c19-6869-494f-9759-3583d2f72fea`;

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  getInterstateTransfers(from: string, to: string): Observable<PurchaseOrderLine[]> {
    return this.http.get<{lines: PurchaseOrderLine[]}>(`${environment.gpEndpoint}/po?from=${from}&to=${to}`).pipe(
      map(_ => _.lines)
    );
  }

  getPanList(branch: string): Observable<SuggestedItem[]> {
    return this.http.get<{lines: SuggestedItem[]}>(`${environment.gpEndpoint}/pan?branch=${branch}`).pipe(
      map(_ => _.lines)
    );
  }

  getPanListWithQuantities(branch: string, panListId: string): Observable<SuggestedItem[]> {
    return combineLatest([this.getPanList(branch), this.getRequestedQuantities(panListId)]).pipe(
      map(([a, b]) => {
        b.forEach(q => {
          const thisOne = a.find(_ => _.ItemNumber === q.fields.ItemNumber);
          if (thisOne) thisOne['ToTransfer'] = q.fields.Quantity;
        });
        return a;
      })
    )
  }

  getRequestedQuantities(panListId: string): Observable<RequestLine[]> {
    const url = `${this._panListLinesUrl}/items?expand=fields(select=ItemNumber,Quantity)&filter=fields/Title eq '${panListId}'`;
    return this.http.get(url).pipe(
      map((res: any) => res.value as RequestLine[]),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of([]);
      })
    );
  }

  setRequestedQuantities(quantity: number | null | undefined, itemNumber: string, panListId: string): Observable<RequestLine> {
    const url = `${this._panListLinesUrl}/items?expand=fields(select=Title)&filter=fields/Title eq '${panListId}' and fields/ItemNumber eq '${itemNumber}'`;
    return this.http.get(url).pipe(
      switchMap((res: any) => {
        const matches = res.value as RequestLine[];
        if (matches.length > 0) {
          const id = matches[0].id;
          const fields = {Quantity: quantity};
          return this.http.patch<RequestLine>(`${this._panListLinesUrl}/items('${id}')`, {fields});
        } else {
          const fields = {ItemNumber: itemNumber, Quantity: quantity, Title: panListId}
          return this.http.post<RequestLine>(`${this._panListLinesUrl}/items`, {fields});
        }
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        return of();
      })
    );
  }

  createTransfer(fromSite: string | null, toSite: string | null, lines: any): Observable<Object> {
    if (!fromSite || !toSite) return of();
    const payload = {fromSite, toSite, lines}
    return this.http.post(`${environment.gpEndpoint}/po`, payload);
  }

  getPurchaseOrder(id: string): Observable<PurchaseOrder>  {
    return this.http.get<PurchaseOrder>(`${environment.gpEndpoint}/po/${id}`);
  }

}