import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';

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

  getInterstateTransfers(from: string, to: string) {
    console.log(from, to)
    return this.http.get<PurchaseOrderLine[]>(`${environment.gpEndpoint}po?from=${from}&to=${to}`);
  }

  getPurchaseOrder(id: string) {
    return this.http.get<PurchaseOrder>(`${environment.gpEndpoint}po/${id}`).pipe(
      tap(_ => console.log(_))
    );
  }

}