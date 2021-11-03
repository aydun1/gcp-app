import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

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
    if ('name' in filters) url += `&$filter=startswith(name,'${filters.name}')`;
    url += '&$top=20';
    url += `&$orderby=name`;
    return url;
  }

  getCustomers() {
    const url = `${this.url}/accounts?$select=name,accountnumber&$top=20`;
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
