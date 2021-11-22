import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { Customer } from '../shared/customer';
import { CustomersService } from '../shared/customers.service';
import { PalletDialogComponent } from '../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../../recycling/shared/recycling-dialog/recycling-dialog.component';
import { RecyclingService } from '../../recycling/shared/recycling.service';
import { PalletsService } from '../../pallets/shared/pallets.service';
import { CustomerSiteDialogComponent } from '../shared/customer-site-dialog/customer-site-dialog.component';

@Component({
  selector: 'gcp-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnInit {
  private id: string;
  private navigationSubscription: Subscription;
  private sitesSubject$ = new Subject<string>();
  private palletsSubject$ = new Subject<string>();
  private cagesSubject$ = new Subject<string>();
  public customer$: Observable<any>;
  public site: string;
  public sites: any;
  public pallets: any;
  public cages: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private dialog: MatDialog,
    private cutomersService: CustomersService,
    private recyclingService: RecyclingService,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    this.customer$ = this.getCustomer();
    this.site = '';

    this.sitesSubject$.pipe(
      switchMap(id => this.cutomersService.getSites(id))
    ).subscribe(sites => this.sites = sites);

    this.palletsSubject$.pipe(
      switchMap(id => this.palletsService.getCustomerPallets(id)),
      map(pallets => ['Loscam', 'Chep', 'Plain'].reduce((acc,curr) => {
        const count = pallets.filter(_ => _.fields.Pallet === curr).reduce((subtotal, qty) => subtotal + parseInt(qty.fields.Out) - parseInt(qty.fields.In), 0);
        acc[curr] = count;
        return acc;
      },{}))
    ).subscribe(pallets => this.pallets = pallets);

    this.cagesSubject$.pipe(
      switchMap(id => this.recyclingService.getCagesWithCustomer(id)),
      map(cages => {
        const weight = cages.map(_ => _.fields.NetWeight || 0).reduce((acc, curr) => acc + curr, 0);
        return {weight};
      })
    ).subscribe(cages => this.cages = cages);

    this.navigationSubscription = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      tap(_ => {if (this.id !==  this.route.snapshot.paramMap.get('id')) this.customer$ = this.getCustomer()})
    ).subscribe();

  }

  ngOnDestroy() {
    this.navigationSubscription.unsubscribe();
  }

  getCustomer() {
    this.id = this.route.snapshot.paramMap.get('id');
    return this.cutomersService.getCustomer(this.id).pipe(
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

  openSiteDialog(customer: string) {
    const data = {customer};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(result => {
      this.refreshSites(data.customer);
      if (!result) return;
    });
  }

  openPalletDialog(customer: Customer) {
    const data = {customer};
    const dialogRef = this.dialog.open(PalletDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPallets(data.customer.accountnumber);
      if (!result) return;
    });
  }

  openRecyclingDialog(customer: Customer) {
    const data = {customer};
    const dialogRef = this.dialog.open(RecyclingDialogComponent, {width: '800px', data});
    dialogRef.afterClosed().subscribe(result => {
      this.refreshCages(data.customer.accountnumber);
      if (!result) return;
    });
  }

  setSite(site: string) {
    this.site = site;
  }

  goBack() {
    this.location.back();
  }
}
