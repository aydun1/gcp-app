import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, lastValueFrom, map, Observable, of, switchMap, tap, timer } from 'rxjs';

import { SharedService } from '../shared.service';
import { Pallet } from '../pallets/shared/pallet';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AutomateService {
  private endpoint = `${environment.endpoint}/${environment.siteUrl}`;
  private palletsUrl = 'lists/38f14082-02e5-4978-bf92-f42be2220166';
  private palletsOwedUrl = 'lists/8ed9913e-a20e-41f1-9a2e-0142c09f2344';
  private palletTrackerUrl = `${this.endpoint}/${this.palletsUrl}`;
  private i = 0;

  private toUpdate: Array<Pallet> = [
  ] as unknown as Array<Pallet>;

  private month = 12;
  private year = 2021
  private branch = 'VIC';

  constructor(
    private http: HttpClient,
    private shared: SharedService
  ) { }

  updateGP(): Observable<number> {
    let url = `${this.palletTrackerUrl}/items?expand=fields(select=Created)&filter=fields/CustomerNumber ne null &top=2000`;
    const a$: Observable<string[]> = this.http.get(url).pipe(
      map((res: any) => res.value as Pallet[]),
      map(_ => _.map(p => p.id))
    );

    const b$ = timer(1000, 4000);
    return combineLatest([a$, b$]).pipe(
      switchMap(([a, b]) => this.removeId(a[this.i])),
      tap(() => this.i += 1),
      map(_ => this.i)
    )
  }

  setToZero(pallet: Pallet): Observable<any> {
    const shouldRun = 0;
    const payload = {fields: {In: 0, Out: 0, Quantity: 0}};
    return shouldRun ? this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${pallet.id}')`, payload) : of();
  }

  setReference(pallet: Pallet): Observable<any>  {
    const shouldRun = 1;
    console.log(pallet)
    const d = pallet['date'].split(' ');
    const dateBits = d[0].split('/').map((_: string) => parseInt(_));
    const timeBits = d[1].split(':').map((_: string) => parseInt(_));;
    const oldDate = (new Date(dateBits[2], dateBits[1] - 2, 15, timeBits[0], timeBits[1])).toISOString();
    const newDate = (new Date(dateBits[2], dateBits[1] - 1, dateBits[0], timeBits[0], timeBits[1])).toISOString();
    const payload = {fields: {Reference: null, OldDate: oldDate}};
    return shouldRun ? this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${pallet.id}')`, payload) : of();
  }

  getAndSet(): Observable<number> {
    const date = new Date('2022/07/01').toISOString();
    const branch = 'VIC'
    const top = 2000;
    //let url = `${this.palletTrackerUrl}/items?expand=fields(select=Created)&filter=fields/Created ge '${date}' and fields/Branch eq '${branch}' and fields/CustomerNumber ne null'&top=${top}`;
    //const a$: Observable<Pallet[]> = this.http.get(url).pipe(
    //  ap((res: any) => res.value as Pallet[]),
    //  tap(_ => console.log(_.length))
    //);
    const a$ = of(this.toUpdate)
    const b$ = timer(1000, 2000);
    return combineLatest([a$, b$]).pipe(
      switchMap(([a, b]) => this.setReference(a[this.i])),
      tap(() => this.i += 1),
      map(_ => this.i)
    )
  }

  changePalletTypes(oldPallet: string, newPallet: string): Observable<any> {
    const shouldRun = 0;
    let delay = 0;
    const delayIncrement = 3000;
    const branch = 'QLD';
    if (shouldRun) return of();
    const filters = [
      `fields/CustomerNumber eq '3Q09778'`,
      `fields/Branch eq '${branch}'`,
      `fields/CustomerNumber ne null`,
      `fields/Pallet eq '${oldPallet}'`
    ];
    const url = `${this.palletTrackerUrl}/items?expand=fields(select=Title,Branch,CustomerNumber,Site,From,To,In,Out,Pallet,Quantity,Date,Notes)&filter=${filters.join(' and ')}&top=2000`;
    return this.http.get(url).pipe(
      map((res: any) => res.value as Pallet[]),
      tap(_ => console.log(`Got ${_.length} items.`)),
      map(_ => _.filter(p => p.fields.In > 0 || p.fields.Out > 0)),
      tap(_ => console.log(`${_.length} are non-zero.`)),
      switchMap(_ => {
        return _.map(async pallet => {
          delay += delayIncrement;
          return new Promise(resolve => setTimeout(resolve, delay)).then(() => {
            const postPayload = {...pallet['fields'], Pallet: newPallet};
            delete postPayload['@odata.etag'];
            const patchPayload = {In: 0, Out: 0, Quantity: 0};
            const headers = {'Content-Type': 'application/json'};
            const url = `${environment.siteUrl}/${this.palletsUrl}/items`;
            const requests = [
              {id: 1, method: 'PATCH', url: `${url}/${pallet.id}`, headers, body: {fields: patchPayload}},
              {id: 2, method: 'POST', url, headers, body: {fields: postPayload}}
            ];
            const actionObs = this.http.post(`${environment.endpoint}/$batch`, {requests});
            return lastValueFrom(actionObs);
          });
        });
      })
    );
  }

  getAll(): Observable<any> {
    const nextMonth = this.month < 12 ? this.month + 1 : 1;
    const nextYear = this.month < 12 ? this.year : this.year + 1;

    const filters = `fields/CustomerNumber ne null and fields/Created ge '${this.year}-${this.month}-01T00:00:00Z' and fields/Created lt '${nextYear}-${nextMonth}-01T00:00:00Z'`;
    const url = `${this.palletTrackerUrl}/items?expand=fields(select=CustomerNumber,Created,Pallet,Out,In,Branch,Site)&filter=${filters}&top=2000`;

    return this.http.get(url).pipe(
      map((res: any) => res.value as Pallet[]),
      tap(_ => console.log(`Got ${_.length} items.`)),
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
      tap(_ => console.log(`Reduced to ${_.length} items.`)),
      tap(_ => console.log(_))
    );
  }

  doAction() {
    const a$ = this.getAll();
    const b$ = timer(1000, 1000);
    return combineLatest([a$, b$]).pipe(
      switchMap(([a, b]) => this.updateTotals(a[this.i])),
      tap(() => this.i += 1),
      tap(_ => console.log(this.i, _['fields'].Title)),
      map(_ => this.i)
    )
  }

  updateTotals(a: any) {
    const url = `${this.endpoint}/${this.palletsOwedUrl}`
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

  updateCrm(accountNumber: string, palletType: string, palletCount: number) {
    const url = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2/accounts';
    const cleanNumber = accountNumber.replace('&', '%26').replace("'", "''")
    const urlGet = `${url}?$select=accountnumber&$filter=accountnumber eq '${cleanNumber}'`;
    console.log(urlGet)
    this.http.get(urlGet).pipe(
      map(res => res['value'][0]['accountid']),
      switchMap(id => {
        const patchUrl = `${url}(${id})`;
        const payload = {[palletType]: palletCount};
        return this.http.patch(patchUrl, payload);
      })
    ).subscribe();
  }

  doThing() {
    let i = 0;
    const cust = '07330';
    const pallets: Array<[string, string, number]> = [
      //[cust, "new_pallets_loscam", 58],
      [cust, "new_pallets_chep", 1],
      [cust, "new_pallets_plain", 5],
    ]
    const source = timer(1000, 1000).subscribe(val => {
      console.log(pallets[i]);
      this.updateCrm(pallets[i][0], pallets[i][1], pallets[i][2])
      i += 1;
    });
  }

  removeId(id: string): Observable<any> {
    const payload = {fields: {ImportID: null,}};
    return this.http.patch<Pallet>(`${this.palletTrackerUrl}/items('${id}')`, payload);
  }
}

