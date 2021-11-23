import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { Customer } from '../shared/customer';
import { Site } from '../shared/site';

import { CustomersService } from '../shared/customers.service';
import { PalletDialogComponent } from '../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../../recycling/shared/recycling-dialog/recycling-dialog.component';
import { RecyclingService } from '../../recycling/shared/recycling.service';
import { PalletsService } from '../../pallets/shared/pallets.service';
import { CustomerSiteDialogComponent } from '../shared/customer-site-dialog/customer-site-dialog.component';

interface PalletQuantities {
  Loscam: number,
  Chep: number,
  Plain: number
}

@Component({
  selector: 'gcp-customer-view',
  host: {class:'app-component'},
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnInit {
  private sitesSubject$ = new Subject<string>();
  private palletsSubject$ = new Subject<string>();
  private cagesSubject$ = new Subject<string>();
  public customer$: Observable<any>;
  public site: string;
  public sites: Array<Site>;
  public pallets: PalletQuantities;
  public cages: {weight: number};

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private dialog: MatDialog,
    private cutomersService: CustomersService,
    private recyclingService: RecyclingService,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    this.sitesSubject$.pipe(
      switchMap(id => this.cutomersService.getSites(id)),
      tap(sites => this.sites = sites)
    ).subscribe();

    this.palletsSubject$.pipe(
      switchMap(id => this.palletsService.getCustomerPallets(id, this.site)),
      map(pallets => ['Loscam', 'Chep', 'Plain'].reduce((acc,curr) => {
        const count = pallets.filter(_ => _.fields.Pallet === curr).reduce((subtotal, qty) => subtotal + parseInt(qty.fields.Out) - parseInt(qty.fields.In), 0);
        acc[curr] = count;
        return acc;
      }, {} as PalletQuantities))
    ).subscribe(pallets => this.pallets = pallets);

    this.cagesSubject$.pipe(
      switchMap(id => this.recyclingService.getCagesWithCustomer(id)),
      map(cages => {
        const weight = cages.map(_ => _.fields.NetWeight || 0).reduce((acc, curr) => acc + curr, 0);
        return {weight};
      })
    ).subscribe(cages => this.cages = cages);


    this.customer$ = this.route.paramMap.pipe(
      switchMap(params => this.getCustomer(params.get('id'))
    ))
  }

  getCustomer(id: string) {
    return this.cutomersService.getCustomer(id).pipe(
      tap(_ => this.refreshSites(_.accountnumber)),
      tap(_ => this.refreshPallets(_.accountnumber)),
      tap(_ => this.refreshCages(_.accountnumber))
    );
  }

  refreshSites(id: string) {
    this.sitesSubject$.next(id);
  }

  refreshPallets(id: string) {
    this.palletsSubject$.next(id);
  }

  refreshCages(id: string) {
    this.cagesSubject$.next(id);
  }

  openSiteDialog(customer: Customer) {
    const data = {customer};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(() => this.refreshSites(data.customer.accountnumber));
  }

  openPalletDialog(customer: Customer) {
    const data = {customer, sites: this.sites, site: this.site};
    const dialogRef = this.dialog.open(PalletDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(() => this.refreshPallets(data.customer.accountnumber));
  }

  openRecyclingDialog(customer: Customer) {
    const data = {customer, sites: this.sites, site: this.site};
    const dialogRef = this.dialog.open(RecyclingDialogComponent, {width: '800px', data});
    dialogRef.afterClosed().subscribe(() => this.refreshCages(data.customer.accountnumber));
  }

  setSite(customer: string, site: string) {
    this.site = site;
    this.refreshPallets(customer);
  }

  goBack() {
    this.location.back();
  }
}
