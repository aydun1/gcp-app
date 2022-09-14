import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PurchaseOrder } from './purchase-order';
import { PurchaseOrderLine } from './purchase-order-line';




@Injectable({
  providedIn: 'root'
})
export class InterstateTransfersService {

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
  ) { }

  getInterstateTransfers(from: string, to: string): Observable<PurchaseOrderLine[]> {
    console.log(from, to)
    return this.http.get<PurchaseOrderLine[]>(`${environment.gpEndpoint}po?from=${from}&to=${to}`);
  }

  createTransfer(fromSite: string | null, toSite: string | null, lines: any): Observable<Object> {
    if (!fromSite || !toSite) return of();
    const payload = {fromSite, toSite, lines}
    return this.http.post(`${environment.gpEndpoint}po`, payload);
  }

  getPurchaseOrder(id: string): Observable<PurchaseOrder>  {
    return this.http.get<PurchaseOrder>(`${environment.gpEndpoint}po/${id}`);
  }

}