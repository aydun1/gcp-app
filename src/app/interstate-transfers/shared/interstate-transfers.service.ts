import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { BehaviorSubject, map, Observable, of, lastValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { InTransitTransfer } from './intransit-transfer';
import { IntransitTransferLine } from './intransit-transfer-line';
import { PurchaseOrder } from './purchase-order';
import { PurchaseOrderLine } from './purchase-order-line';

@Injectable({
  providedIn: 'root'
})
export class InterstateTransfersService {

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  getPurchaseOrders(from: string, to: string): Observable<PurchaseOrderLine[]> {
    return this.http.get<{lines: PurchaseOrderLine[]}>(`${environment.gpEndpoint}/po?from=${from}&to=${to}`).pipe(
      map(_ => _.lines)
    );
  }

  getInterstateTransfers(from: string, to: string): Observable<IntransitTransferLine[]> {
    return this.http.get<{lines: IntransitTransferLine[]}>(`${environment.gpEndpoint}/itt?from=${from}&to=${to}`).pipe(
      map(_ => _.lines)
    );
  }

  getInTransitTransfer(id: string): Observable<InTransitTransfer> {
    return this.http.get<InTransitTransfer>(`${environment.gpEndpoint}/itt/${id}`);
  }

  createTransfer(fromSite: string | null, toSite: string | null, lines: any): Observable<Object> {
    if (!fromSite || !toSite) return of();
    const payload = {fromSite, toSite, lines}
    return this.http.post(`${environment.gpEndpoint}/po`, payload);
  }

  createId(branch: string): string {
    const d = new Date();
    const yy = d.getFullYear().toString().substring(2);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0').substring(0, 1);
    return `ITT${branch[0]}${yy}${mm}${dd}${h}${m}${s}`;
  }

  createInTransitTransfer(fromSite: string | null, toSite: string | null, lines: any, id: string): Promise<Object> {
    const payload = {fromSite, toSite, lines, id};
    const request = this.http.post(`${environment.gpEndpoint}/itt`, payload);
    return lastValueFrom(request);
  }

  getPurchaseOrder(id: string): Observable<PurchaseOrder>  {
    return this.http.get<PurchaseOrder>(`${environment.gpEndpoint}/po/${id}`);
  }

}