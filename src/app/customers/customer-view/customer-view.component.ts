import { Component, HostBinding, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, filter, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { Customer } from '../shared/customer';
import { Site } from '../shared/site';
import { CustomersService } from '../shared/customers.service';
import { PalletDialogComponent } from '../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../../recycling/shared/recycling-dialog/recycling-dialog.component';
import { RecyclingService } from '../../recycling/shared/recycling.service';
import { PalletsService } from '../../pallets/shared/pallets.service';
import { CustomerSiteDialogComponent } from '../shared/customer-site-dialog/customer-site-dialog.component';
import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { RecyclingDocketDialogComponent } from '../../recycling/shared/recycling-docket-dialog/recycling-docket-dialog.component';
import { DeliveryService } from '../../runs/shared/delivery.service';
import { Address } from '../shared/address';
import { RunPickerDialogComponent } from '../../runs/shared/run-picker-dialog/run-picker-dialog.component';

@Component({
  selector: 'gcp-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';

  private sitesSubject$ = new Subject<string>();
  private palletsSubject$ = new Subject<string>();
  private cagesSubject$ = new Subject<string>();
  private customer!: Customer;
  public customer$!: Observable<Customer>;
  public site!: string;
  public sites!: Array<Site>;
  public palletsOwing!: {Loscam: number, Chep: number, Plain: number} | null;
  public loscams!: number;
  public cheps!: number;
  public plains!: number;
  public cages!: {count: number, weight: number} | null;
  public addresses: Array<Address> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private navService: NavigationService,
    private sharedService: SharedService,
    private cutomersService: CustomersService,
    private deliveryService: DeliveryService,
    private recyclingService: RecyclingService,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    this.customer$ =  combineLatest([this.route.paramMap, this.route.queryParams]).pipe(
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => {
        this.parseParams(_);
        this.refreshPallets();
        this.refreshCages();
      }),
      distinctUntilChanged((prev, curr) => prev[0].get('id') === curr[0].get('id')),
      switchMap(([paramMap, params]) => this.getCustomer(paramMap.get('id')))
    );
  
    this.sitesSubject$.pipe(
      switchMap(id => this.cutomersService.getSites(id)),
      tap(sites => this.sites = sites)
    ).subscribe();

    this.palletsSubject$.pipe(
      tap(() => this.palletsOwing = null),
      switchMap(id => this.palletsService.getPalletsOwedByCustomer(id, this.site)),
    ).subscribe(pallets => this.palletsOwing = pallets);

    this.cagesSubject$.pipe(
      tap(() => this.cages = null),
      switchMap(id => this.recyclingService.getCagesWithCustomer(id, this.site)),
      map(cages => {
        const activeCages = cages.filter(_ => _.fields.Status === 'Delivered to customer').map(_ => 1).reduce((acc, curr) => acc + curr, 0);
        const totalWeight = cages.map(_ => +_.fields.NetWeight || 0).reduce((acc, curr) => acc + curr, 0);
        return {count: activeCages, weight: totalWeight};
      })
    ).subscribe(cages => this.cages = cages);
  }

  parseParams(params: Params): void {
    if (!params) return;
    this.site = params[1]['site'];
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!prev || !curr) return true;
    const sameSite = prev[1]['site'] === curr[1]['site'];
    return sameSite;
  }

  getCustomer(id: string | null): Observable<Customer> {
    if (!id) return of();
    return this.cutomersService.getCustomer(id).pipe(
      tap(_ => {
        this.customer = _;
        this.setTitle();
        this.refreshSites();
        this.getAddresses();
        this.refreshPallets();
        this.refreshCages();
      })
    );
  }

  getAddresses(): void {
    if (!this.customer) return;
    this.cutomersService.getAddresses(this.customer.accountnumber).subscribe(_ => this.addresses = _);
  }

  refreshSites(): void {
    if (!this.customer) return;
    this.sitesSubject$.next(this.customer.accountnumber);
  }

  refreshPallets(): void {
    if (!this.customer) return;
    this.palletsSubject$.next(this.customer.accountnumber);
  }

  refreshCages(): void {
    if (!this.customer) return;
    this.cagesSubject$.next(this.customer.accountnumber);
  }

  requestCages() {
    const cageNumber = 0;
    const collect = false;
    const data = {accountnumber: this.customer.accountnumber, site: this.site, cageNumber, collect};
    this.dialog.open(RunPickerDialogComponent, {width: '600px', data, autoFocus: false});
  }

  openSiteDialog(customer: Customer): void {
    const data = {customer, sites: this.sites};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshSites());
  }

  openPalletDialog(customer: Customer): void {
    if (!this.sites) return;
    const data = {customer, sites: this.sites, site: this.site};
    const dialogRef = this.dialog.open(PalletDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshPallets());
  }

  openRecyclingDialog(customer: Customer): void {
    if (!this.sites) return;
    const data = {customer, sites: this.sites, site: this.site};
    const dialogRef = this.dialog.open(RecyclingDialogComponent, {width: '800px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshCages());
  }

  openRecyclingDocketDialog(customer: Customer): void {
    const data = {customer, addresses: this.addresses};
    const dialogRef = this.dialog.open(RecyclingDocketDialogComponent, {width: '800px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe();
  }

  setSite(customer: Customer, site: string | null): void {
    this.router.navigate([], { queryParams: {site: site}, queryParamsHandling: 'merge', replaceUrl: true}).then(
      () => this.sharedService.setTitle(`${customer.name} ${site ? '(' + this.site + ')' : '' }`)
    );
  }

  setTitle() {
    this.sharedService.setTitle(`${this.customer.name} ${this.site ? '(' + this.site + ')' : '' }`)
  }

  goBack(): void {
    this.navService.back();
  }
}
