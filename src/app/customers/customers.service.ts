import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {

  private accountsUrl = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2/accounts';
  constructor(
    private http: HttpClient
  ) { }

  getCustomers() {
    const url = `${this.accountsUrl}?$select=name,accountnumber&$top=10`;
    return this.http.get(url);
  }

  getCustomersStartingWith(start: string) {
    const url = `${this.accountsUrl}?$select=name,accountnumber&$filter=startswith(name,'${start}')&$top=10`;
    return this.http.get(url);
  }

}
