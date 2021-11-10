import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PalletsService {
  private dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private palletTrackerUrl = `${this.dataGroupUrl}/38f14082-02e5-4978-bf92-f42be2220166/items`;
  constructor(
    private http: HttpClient
  ) { }

  addPallets(custnmbr: string, v: any) {
    const payload = {fields: {Title: custnmbr, Pallet: v.palletType, In: v.inQty, Out: v.outQty, Notes: v.notes}};
    return this.http.post(this.palletTrackerUrl, payload);
  }

  getPallets(custnmbr: string) {
    const url = this.palletTrackerUrl + `?expand=fields(select=Title,Pallet,In,Out,Change)&filter=fields/Title eq '${encodeURIComponent(custnmbr)}'`;
    return this.http.get(url).pipe(map((_: any) => _.value));
  }
}
