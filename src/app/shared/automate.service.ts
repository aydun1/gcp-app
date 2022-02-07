import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, switchMap, tap, timer } from 'rxjs';

import { SharedService } from 'src/app/shared.service';
import { Pallet } from '../pallets/shared/pallet';

@Injectable({
  providedIn: 'root'
})
export class AutomateService {
  private endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private palletsUrl = 'lists/38f14082-02e5-4978-bf92-f42be2220166';
  private palletsOwedUrl = 'lists/8ed9913e-a20e-41f1-9a2e-0142c09f2344';
  private palletTrackerUrl = `${this.endpoint}/${this.palletsUrl}`;
  private i = 0;

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
    const nextMonth = this.month < 12 ? this.month + 1 : 1;
    const nextYear = this.month < 12 ? this.year : this.year + 1;

    const filters = `fields/CustomerNumber ne null and fields/Created ge '${this.year}-${this.month}-01T00:00:00Z' and fields/Created lt '${nextYear}-${nextMonth}-01T00:00:00Z'`;
    const url = `${this.palletTrackerUrl}/items?expand=fields(select=CustomerNumber,Created,Pallet,Out,In,Branch,Site)&filter=${filters}&top=2000`;

    return this.http.get(url).pipe(
      map((res: {value: Pallet[]}) => res.value),
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
    const pallets: Array<[string, string, number]> = [
      ["2TJ'SN11", "new_pallets_loscam", 2]]
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