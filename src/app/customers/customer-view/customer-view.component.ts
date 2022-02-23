import { Component, HostBinding, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, Subject, switchMap, tap } from 'rxjs';

import { Customer } from '../shared/customer';
import { Site } from '../shared/site';
import { CustomersService } from '../shared/customers.service';
import { PalletDialogComponent } from '../../pallets/shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../../recycling/shared/recycling-dialog/recycling-dialog.component';
import { RecyclingService } from '../../recycling/shared/recycling.service';
import { PalletsService } from '../../pallets/shared/pallets.service';
import { CustomerSiteDialogComponent } from '../shared/customer-site-dialog/customer-site-dialog.component';
import { NavigationService } from '../../navigation.service';
import { SharedService } from 'src/app/shared.service';

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
  public customer$: Observable<Customer>;
  public site: string;
  public sites: Array<Site>;
  public palletsOwing: any;
  public loscams: number;
  public cheps: number;
  public plains: number;
  public cages: {count: number, weight: number};

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private navService: NavigationService,
    private sharedService: SharedService,
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
      tap(() => this.palletsOwing = null),
      switchMap(id => this.palletsService.getPalletsOwedByCustomer(id, this.site))
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


    this.customer$ = this.route.paramMap.pipe(
      switchMap(params => this.getCustomer(params.get('id'))),
      tap(_ => this.sharedService.setTitle(_.name))
    );
  }

  getCustomer(id: string): Observable<Customer> {
    return this.cutomersService.getCustomer(id).pipe(
      tap(_ => {
        this.refreshSites(_.accountnumber);
        this.refreshPallets(_.accountnumber);
        this.refreshCages(_.accountnumber);
      })
    );
  }

  refreshSites(id: string): void {
    this.sitesSubject$.next(id);
  }

  refreshPallets(id: string): void {
    this.palletsSubject$.next(id);
  }

  refreshCages(id: string): void {
    this.cagesSubject$.next(id);
  }

  openSiteDialog(customer: Customer): void {
    const data = {customer};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(() => this.refreshSites(data.customer.accountnumber));
  }

  openPalletDialog(customer: Customer): void {
    const data = {customer, sites: this.sites, site: this.site};
    const dialogRef = this.dialog.open(PalletDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(() => this.refreshPallets(data.customer.accountnumber));
  }

  openRecyclingDialog(customer: Customer): void {
    const data = {customer, sites: this.sites, site: this.site};
    const dialogRef = this.dialog.open(RecyclingDialogComponent, {width: '800px', data});
    dialogRef.afterClosed().subscribe(() => this.refreshCages(data.customer.accountnumber));
  }

  setSite(customer: string, site: string): void {
    this.site = site;
    this.refreshPallets(customer);
    this.refreshCages(customer);
  }

  goBack(): void {
    this.navService.back();
  }
}
