import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PurchaseOrder } from './purchase-order';
import { PurchaseOrderLine } from './purchase-order-line';
import { SuggestedItem } from './suggested-item';




@Injectable({
  providedIn: 'root'
})
export class InterstateTransfersService {

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
  ) { }

  getInterstateTransfers(from: string, to: string): Observable<PurchaseOrderLine[]> {
    return this.http.get<{lines: PurchaseOrderLine[]}>(`${environment.gpEndpoint}/po?from=${from}&to=${to}`).pipe(
      map(_ => _.lines)
    );
  }

  getPanList(branch: string): Observable<SuggestedItem[]> {
    return this.http.get<{lines: SuggestedItem[]}>(`${environment.gpEndpoint}/pan?branch=${branch}`).pipe(
      map(_ => _.lines)
    );;
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