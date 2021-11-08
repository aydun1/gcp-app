import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class RecyclingService {

  private url = 'https://gardencityplastics.crm6.dynamics.com/api/data/v9.2';
  private dataGroupUrl = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/lists';
  private palletTrackerUrl = `${this.dataGroupUrl}/38f14082-02e5-4978-bf92-f42be2220166/items`;
  private cageTrackerUrl = `${this.dataGroupUrl}/afec6ed4-8ce3-45e7-8ac7-90428d664fc7/items`;
  private nextPage: string;
  private loadingCustomers: boolean;
  constructor(
    private http: HttpClient
  ) { }

}
