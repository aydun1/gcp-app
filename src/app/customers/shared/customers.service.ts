import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {

  private url = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2';

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
}
