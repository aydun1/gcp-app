import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, map, Observable, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Reconciliation } from '../shared/reconciliation';

@Injectable({
  providedIn: 'root'
})
export class PalletsReconciliationService {
  private _listUrl = 'lists/920f186f-60f2-4c7e-ba8e-855ff2d9c8aa';
  private _reconciliationTrackerUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _loadingPallets!: boolean;
  private _nextPage!: string;
  private _palletsSubject$ = new BehaviorSubject<Reconciliation[]>([]);
  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient
  ) { }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    let url = `${this._reconciliationTrackerUrl}/items?expand=fields`;
    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `(fields/Branch eq '${filters['branch']}')`;
        case 'pallet':
          return `fields/Pallet eq '${filters['pallet']}'`;
        default:
          return '';
      }
    }).filter(_ => _);
    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/Created desc&top=25`;
    return url;
  }

  private getReconciliations(url: string, paginate = false): Observable<Reconciliation[]> {
    this.loading.next(true);
    this._loadingPallets = true;
    return this.http.get(url).pipe(
      tap(_ => {
        this._nextPage = paginate ? _['@odata.nextLink'] : this._nextPage;
        this.loading.next(false);
        this._loadingPallets = false;
      }),
      map((res: any) => res.value)
    );
  }

  getFirstPage(filters: Params): BehaviorSubject<Reconciliation[]> {
    this._nextPage = '';
    this._loadingPallets = false;
    const url = this.createUrl(filters);
    this.getReconciliations(url, true).subscribe(_ => this._palletsSubject$.next(_));
    return this._palletsSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingPallets) return;
    this._palletsSubject$.pipe(
      take(1),
      switchMap(acc => this.getReconciliations(this._nextPage, true).pipe(
        map(curr => [...acc, ...curr]),
      ))
    ).subscribe(_ => this._palletsSubject$.next(_));
  }

  addReconciliation(v: any): Observable<Reconciliation> {
    const payload = {fields: {
      Date: v.date,
      Branch: v.branch,
      Pallet: v.pallet,
      CurrentBalance: v.currentBalance,
      ToBeCollected: v.toBeCollected,
      ToBeRepaid: v.toBeRepaid,
      InTransitOff: v.inTransitOff,
      InTransitOn: v.inTransitOn,
      Surplus: v.surplus,
      Deficit: v.deficit,
      OnSite: v.onSite,
      OffSite: v.offSite,
    }};
    return this.http.post<Reconciliation>(`${this._reconciliationTrackerUrl}/items`, payload).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  updateReconciliation(id: string, v: any): Observable<Reconciliation> {
    const fields = {
      CurrentBalance: v.currentBalance,
      Surplus: v.surplus,
      Deficit: v.deficit,
      OnSite: v.onSite,
      OffSite: v.offSite,
    };
    return this.http.patch<Reconciliation>(`${this._reconciliationTrackerUrl}/items('${id}')`, {fields}).pipe(
      switchMap(res => this.updateList(res))
    );
  }

  getReconciliation(id: string): Observable<Reconciliation> {
    const url = `${this._reconciliationTrackerUrl}/items('${id}')`;
    return this.http.get<Reconciliation>(url);
  }

  private updateList(res: Reconciliation): Observable<Reconciliation> {
    return this._palletsSubject$.pipe(
      take(1),
      map(_ => {
        const pallets = _.map(pallet => pallet);
        const i = pallets.findIndex(pallet => pallet.id === res.id);
        if (i > -1) pallets[i] = res
        else pallets.unshift(res);
        this._palletsSubject$.next(pallets);
        return res
      })
    );
  }

}
