import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, lastValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { InTransitTransfer } from './intransit-transfer';
import { SuggestedItem } from '../../pan-list/suggested-item';

@Injectable({
  providedIn: 'root'
})
export class InterstateTransfersService {

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient
  ) { }

  getInterstateTransfers(from: string, to: string): Observable<SuggestedItem[]> {
    return this.http.get<{lines: SuggestedItem[]}>(`${environment.gpEndpoint}/itt?from=${from}&to=${to}`).pipe(
      map(_ => _.lines)
    );
  }

  getInTransitTransfer(id: string): Observable<InTransitTransfer> {
    return this.http.get<InTransitTransfer>(`${environment.gpEndpoint}/itt/${id}`);
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

  createInTransitTransfer(fromSite: string | null, toSite: string | null, lines: SuggestedItem[]): Promise<InTransitTransfer> {
    const payload = {fromSite, toSite, lines};
    const request = this.http.post<InTransitTransfer>(`${environment.gpEndpoint}/itt`, payload);
    return lastValueFrom(request);
  }

}