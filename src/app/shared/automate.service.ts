import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, take, tap, timer } from 'rxjs';

import { SharedService } from 'src/app/shared.service';
import { Pallet } from '../pallets/shared/pallet';

interface PalletQuantities {
  Loscam: number,
  Chep: number,
  Plain: number
}

@Injectable({
  providedIn: 'root'
})
export class PalletsService {
  private endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private palletsUrl = 'lists/38f14082-02e5-4978-bf92-f42be2220166';
  private palletsOwedUrl = 'lists/99fec67b-8681-43e8-8b63-7bf0b09fd010';
  private _columns$ = new BehaviorSubject<any>(null);
  private palletTrackerUrl = `${this.endpoint}/${this.palletsUrl}`;

  public i = 0;
  public month = 12;
  public year = 2021

  constructor(
    private http: HttpClient,
    private shared: SharedService
  ) { }

  updateGP(): Observable<number> {
    let url = `${this.palletTrackerUrl}/items?expand=fields(select=Created)&filter=fields/CustomerNumber ne null &top=2000`;
    const a$: Observable<string[]> = this.http.get(url).pipe(
      map((res: {value: Pallet[]}) => res.value),
      map(_ => _.map(p => p.id))
    );

    const b$ = timer(1000, 4000);
    return combineLatest([a$, b$]).pipe(
      switchMap(([a, b]) => this.removeId(a[this.i])),
      tap(() => this.i += 1),
      map(_ => this.i)
    )
  }

  getAll(): Observable<any> {
    let url = `${this.palletTrackerUrl}/items?expand=fields(select=CustomerNumber,Created,Pallet,Out,In,Branch,Site)&filter=fields/CustomerNumber ne null and fields/Created ge '${this.year}-${this.month}-01T00:00:00Z'&top=2000`;
    const a$: Observable<any> = this.http.get(url).pipe(
      map((res: {value: Pallet[]}) => res.value),
      tap(_ => console.log(_[_.length - 1])),
      map(pallets => {
        const totals = {}
        pallets.forEach(_ => {
          const key = `${_.fields.Branch},${_.fields.Pallet},${_.fields.CustomerNumber},${_.fields.Site ? _.fields.Site : ''}`;
          const change = _.fields.Out - _.fields.In;
          if (key in totals) {
            totals[key] += change;
          } else {
            totals[key] = change;
          }
        });
        return Object.keys(totals).map(_ => {return {k: _, v: totals[_]}})
      }),
      tap(_ => console.log(_.length)),

    );
    const b$ = timer(1000, 2000);
    return combineLatest([a$, b$]).pipe(
      switchMap(([a, b]) => this.updateTotals(a[this.i])),
      tap(() => this.i += 1),
      tap(_ => console.log(this.i, _['fields'].Title)),

      map(_ => this.i)
    )
  }

  updateTotals(a: any) {
    const url = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists/99fec67b-8681-43e8-8b63-7bf0b09fd010'
    const parts = a['k'].split(',');
    const branch = parts[0];
    const pallet = parts[1];
    const customer = parts[2];
    const dateInt = parseInt(`${this.year}${this.month}`);
  
    const site = parts[3];
    return this.http.get(url + `/items?filter=fields/Branch eq '${branch}' and fields/Pallet eq '${pallet}' and fields/Title eq '${this.shared.sanitiseName(customer)}' and fields/DateInt eq '${dateInt}'` + (site ? ` and fields/Site eq '${site}'` : '')).pipe(
      map(res => res['value']),
      switchMap(res => {
        const payload = {fields: {Title: customer, Branch: branch, Owing: a['v'], Site: site, Pallet: pallet, Year: this.year, Month: this.month, DateInt: dateInt}};
        if (res.length > 0) {
          const id = res[0]['id'];
          return this.http.patch(`${url}/items('${id}')`, payload);
        } else {
          return this.http.post(`${url}/items`, payload);
        }
      })
    );
  }

  removeId(id: string): Observable<any> {
    const payload = {fields: {ImportID: null,}};
    return this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${id}')`, payload);
  }
}