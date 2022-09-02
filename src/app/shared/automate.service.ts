import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, switchMap, tap, timer } from 'rxjs';

import { SharedService } from '../shared.service';
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

  private toUpdate: Array<Pallet> = [
    {id: '908', date: '29/11/2021 16:36'},
    {id: '1130', date: '29/11/2021 16:50'},
    {id: '3140', date: '3/12/2021 12:32'},
    {id: '3141', date: '3/12/2021 12:33'},
    {id: '995', date: '29/11/2021 16:41'},
    {id: '1291', date: '29/11/2021 16:52'},
    {id: '987', date: '29/11/2021 16:41'},
    {id: '1114', date: '29/11/2021 16:44'},
    {id: '969', date: '29/11/2021 16:41'},
    {id: '1107', date: '29/11/2021 16:44'},
    {id: '1159', date: '29/11/2021 16:50'},
    {id: '1280', date: '29/11/2021 16:51'},
    {id: '1281', date: '29/11/2021 16:51'},
    {id: '1048', date: '29/11/2021 16:43'},
    {id: '1075', date: '29/11/2021 16:43'},
    {id: '1074', date: '29/11/2021 16:43'},
    {id: '1211', date: '29/11/2021 16:51'},
    {id: '1212', date: '29/11/2021 16:51'},
    {id: '1173', date: '29/11/2021 16:50'},
    {id: '1188', date: '29/11/2021 16:50'},
    {id: '1006', date: '29/11/2021 16:42'},
    {id: '1312', date: '29/11/2021 16:52'},
    {id: '1146', date: '29/11/2021 16:50'},
    {id: '927', date: '29/11/2021 16:41'},
    {id: '1195', date: '29/11/2021 16:50'},
    {id: '1215', date: '29/11/2021 16:51'},
    {id: '1176', date: '29/11/2021 16:50'},
    {id: '985', date: '29/11/2021 16:41'},
    {id: '1027', date: '29/11/2021 16:42'},
    {id: '12335', date: '29/06/2022 13:46'},
    {id: '12336', date: '29/06/2022 13:46'},
    {id: '12337', date: '29/06/2022 13:46'},
    {id: '12338', date: '29/06/2022 13:46'},
    {id: '912', date: '29/11/2021 16:36'},
    {id: '1272', date: '29/11/2021 16:51'},
    {id: '1197', date: '29/11/2021 16:50'},
    {id: '852', date: '29/11/2021 16:35'},
    {id: '1227', date: '29/11/2021 16:51'},
    {id: '1288', date: '29/11/2021 16:52'},
    {id: '1217', date: '29/11/2021 16:51'},
    {id: '1218', date: '29/11/2021 16:51'},
    {id: '992', date: '29/11/2021 16:41'},
    {id: '1065', date: '29/11/2021 16:43'},
    {id: '998', date: '29/11/2021 16:42'},
    {id: '1085', date: '29/11/2021 16:43'},
    {id: '1044', date: '29/11/2021 16:43'},
    {id: '970', date: '29/11/2021 16:41'},
    {id: '949', date: '29/11/2021 16:41'},
    {id: '1199', date: '29/11/2021 16:50'},
    {id: '953', date: '29/11/2021 16:41'},
    {id: '1293', date: '29/11/2021 16:52'},
    {id: '1135', date: '29/11/2021 16:50'},
    {id: '1031', date: '29/11/2021 16:42'},
    {id: '3174', date: '3/12/2021 13:39'},
    {id: '1319', date: '29/11/2021 16:52'},
    {id: '1186', date: '29/11/2021 16:50'},
    {id: '1077', date: '29/11/2021 16:43'},
    {id: '1078', date: '29/11/2021 16:43'},
    {id: '918', date: '29/11/2021 16:37'},
    {id: '952', date: '29/11/2021 16:41'},
    {id: '889', date: '29/11/2021 16:36'},
    {id: '1283', date: '29/11/2021 16:51'},
    {id: '1004', date: '29/11/2021 16:42'},
    {id: '1140', date: '29/11/2021 16:50'},
    {id: '1125', date: '29/11/2021 16:50'},
    {id: '1282', date: '29/11/2021 16:51'},
    {id: '1270', date: '29/11/2021 16:51'},
    {id: '981', date: '29/11/2021 16:41'},
    {id: '864', date: '29/11/2021 16:36'},
    {id: '1101', date: '29/11/2021 16:43'},
    {id: '3116', date: '3/12/2021 10:03'},
    {id: '1310', date: '29/11/2021 16:52'},
    {id: '1030', date: '29/11/2021 16:42'},
    {id: '1144', date: '29/11/2021 16:50'},
    {id: '1265', date: '29/11/2021 16:51'},
    {id: '1184', date: '29/11/2021 16:50'},
    {id: '1137', date: '29/11/2021 16:50'},
    {id: '1286', date: '29/11/2021 16:52'},
    {id: '1020', date: '29/11/2021 16:42'},
    {id: '1325', date: '29/11/2021 16:52'},
    {id: '1194', date: '29/11/2021 16:50'},
    {id: '3171', date: '3/12/2021 13:36'},
    {id: '1198', date: '29/11/2021 16:50'},
    {id: '1273', date: '29/11/2021 16:51'},
    {id: '910', date: '29/11/2021 16:36'},
    {id: '1244', date: '29/11/2021 16:51'},
    {id: '982', date: '29/11/2021 16:41'},
    {id: '1264', date: '29/11/2021 16:51'},
    {id: '1226', date: '29/11/2021 16:51'},
    {id: '885', date: '29/11/2021 16:36'},
    {id: '1011', date: '29/11/2021 16:42'},
    {id: '1126', date: '29/11/2021 16:50'},
    {id: '1202', date: '29/11/2021 16:51'},
    {id: '960', date: '29/11/2021 16:41'},
    {id: '1208', date: '29/11/2021 16:51'},
    {id: '1116', date: '29/11/2021 16:44'},
    {id: '1117', date: '29/11/2021 16:44'},
    {id: '3362', date: '7/12/2021 15:55'},
    {id: '3363', date: '7/12/2021 16:01'},
    {id: '1225', date: '29/11/2021 16:51'},
    {id: '1061', date: '29/11/2021 16:43'},
    {id: '1032', date: '29/11/2021 16:42'},
    {id: '1238', date: '29/11/2021 16:51'},
    {id: '909', date: '29/11/2021 16:36'},
    {id: '962', date: '29/11/2021 16:41'},
    {id: '1210', date: '29/11/2021 16:51'},
    {id: '1150', date: '29/11/2021 16:50'},
    {id: '1016', date: '29/11/2021 16:42'},
    {id: '1092', date: '29/11/2021 16:43'},
    {id: '1237', date: '29/11/2021 16:51'},
    {id: '1179', date: '29/11/2021 16:50'},
    {id: '1180', date: '29/11/2021 16:50'},
    {id: '929', date: '29/11/2021 16:41'},
    {id: '933', date: '29/11/2021 16:41'},
    {id: '1158', date: '29/11/2021 16:50'},
    {id: '1209', date: '29/11/2021 16:51'},
    {id: '979', date: '29/11/2021 16:41'},
    {id: '980', date: '29/11/2021 16:41'},
    {id: '888', date: '29/11/2021 16:36'},
    {id: '1253', date: '29/11/2021 16:51'},
    {id: '1138', date: '29/11/2021 16:50'},
    {id: '1028', date: '29/11/2021 16:42'},
    {id: '903', date: '29/11/2021 16:36'},
    {id: '3303', date: '7/12/2021 9:58'},
    {id: '3304', date: '7/12/2021 9:58'},
    {id: '3305', date: '7/12/2021 10:00'},
    {id: '1336', date: '29/11/2021 16:52'},
    {id: '3112', date: '3/12/2021 9:59'},
    {id: '1331', date: '29/11/2021 16:52'},
    {id: '1330', date: '29/11/2021 16:52'},
    {id: '1338', date: '29/11/2021 16:52'}
  ] as Array<Pallet>;

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
    const d = pallet.date;
    const dd = d.split(' ')[0].split('/');
    const ddd = new Date(`${dd[2]}/${dd[1]}/${dd[0]}`);
    console.log(ddd);

    const payload = {fields: {Reference: 'version375', Date: ddd.toISOString()}};
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

