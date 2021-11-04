import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {

  private url = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2';
  private palletTrackerUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists/38f14082-02e5-4978-bf92-f42be2220166/items';

  constructor(
    private http: HttpClient
  ) { }

  createUrl(filters: any) {
    let url = `${this.url}/accounts?$select=name,accountnumber`;
    const filterCount = Object.keys(filters).length;
    if(filterCount > 0) {
      url += '&$filter=';
      if ('name' in filters) url += `startswith(name,'${filters.name}')`;
      if (filterCount > 1) url += ' and ';
      if ('territory' in filters) url += `territoryid/name eq '${filters.territory}'`;
    }
    url += '&$top=20';
    url += `&$orderby=name`;
    return url;
  }

  getCustomers() {
    const url = `${this.url}/accounts?$select=name,accountnumber&$top=20`;
    return this.http.get(url);
  }

  getCustomer(id: string) {
    const url = `${this.url}/accounts(${id})`;
    return this.http.get(url);
  }

  getCustomersStartingWith(filters: any) {
    const url = this.createUrl(filters);
    return this.http.get(url);
  }

  getRegions() {
    const url = `${this.url}/territories?$select=name`;
    return this.http.get(url);
  }

  addPallets(custnmbr: string, inQty: number, outQty: number) {
    const payload = {fields: {Title: custnmbr, In: inQty, Out: outQty}}
    return this.http.post(this.palletTrackerUrl, payload)
  }
}
