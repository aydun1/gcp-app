import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, lastValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { InTransitTransfer } from './intransit-transfer';
import { SuggestedItem } from '../../pan-list/suggested-item';
import { SharedService } from '../../shared.service';

@Injectable({
  providedIn: 'root'
})
export class InterstateTransfersService {

  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private shared: SharedService
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

  private emailBody(docId: string, lines: SuggestedItem[], notes: string): string {
    const rows = lines.map(_ => `<tr><td>${_.ItemNmbr}</td><td>${_.ToTransfer}</td></tr>`).join('');
    return `
    <p>
      <strong>Order no.:</strong> <a href="${environment.baseUri}/transfers/active/${docId}">${docId}</a>
    </p>
    <table>
      <tr><th>Item number</th><th>Qty Requested</th></tr>
      ${rows}
    </table>
    <br>
    <strong>Notes:</strong>
    <pre>${notes}</pre>
    `;
  }

  sendQuickRequestEmail(fromState: string, toState: string, ownState: string, lines: SuggestedItem[], docId: string, notes: string): void {
    const mpa = ownState === 'HEA';
    const subject = `Created ITT for ${fromState} to ${toState}`;
    const body = this.emailBody(docId, lines, notes);
    const to = [fromState, toState].filter(_ => _ !== ownState).map(_ => this.shared.emailMap.get(`${_}${mpa ? '_MPA' : ''}` || '')).flat(1).filter(_ => _) as string[];
    const cc = [fromState, toState].filter(_ => _ === ownState).map(_ => this.shared.panMap.get(`${_}${mpa ? '_MPA' : ''}` || '')).flat(1).filter(_ => _) as string[];
    if (environment.production) this.shared.sendMail(to, subject, body, 'HTML', cc);
  }

  sendIttRequestEmail(fromState: string | null, toState: string, lines: SuggestedItem[], docId: string, notes: string): void {
    const subject = `Items requested by ${toState}`;
    const body = this.emailBody(docId, lines, notes);
    const to = this.shared.emailMap.get(fromState || '') || [];
    const cc = this.shared.panMap.get(toState || '') || [];
    console.log(body);
    if (environment.production) this.shared.sendMail(to, subject, body, 'HTML', cc);
  }
}