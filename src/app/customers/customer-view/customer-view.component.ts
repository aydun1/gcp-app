import { Component, HostBinding, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { catchError, combineLatest, distinctUntilChanged, filter, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

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
import { Address } from '../shared/address';
import { RunPickerDialogComponent } from '../../runs/shared/run-picker-dialog/run-picker-dialog.component';
import { PalletCustomerListDialogComponent } from '../../pallets/shared/pallet-customer-list-dialog/pallet-customer-list-dialog.component';
import { RecyclingCustomerListDialogComponent } from '../../recycling/shared/recycling-customer-list-dialog/recycling-customer-list-dialog.component';
import { BigButtonComponent } from '../../shared/big-button/big-button.component';
import { DocsComponent } from '../../shared/docs/docs.component';
import { LoadingPageComponent } from '../../shared/loading/loading-page/loading-page.component';

interface PalletQuantity {
  stateCounts: Array<{name: string, count: number}>,
  states: Array<string>,
  total: number
}
interface PalletQuantities {
  Loscam: PalletQuantity;
  Chep: PalletQuantity;
  GCP: PalletQuantity;
  Plain: PalletQuantity;
}

@Component({
  selector: 'gcp-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css'],
  standalone: true,
  imports: [AsyncPipe, RouterModule, MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatToolbarModule, BigButtonComponent, DocsComponent, LoadingPageComponent]
})
export class CustomerViewComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'app-component mat-app-background';

  private sitesSubject$ = new Subject<string>();
  private palletsSubject$ = new Subject<string>();
  private cagesSubject$ = new Subject<string>();
  private branch_!: string;
  public pallets = this.sharedService.palletDetails;
  public customer$!: Observable<Customer>;
  public site!: string;
  public sites!: Array<Site>;
  public palletsOwing!: PalletQuantities | null;
  public cages!: {count: number, weight: number} | null;
  public addresses: Array<Address> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    private dialog: MatDialog,
    private navService: NavigationService,
    private sharedService: SharedService,
    private cutomersService: CustomersService,
    private recyclingService: RecyclingService,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    this.customer$ =  combineLatest([this.route.paramMap, this.route.queryParams]).pipe(
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _),
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => {
        this.parseParams(_);
      }),
      distinctUntilChanged((prev, curr) => prev[0].get('id') === curr[0].get('id')),
      switchMap(([paramMap, params]) => this.getCustomer(paramMap.get('id')))
    );

    this.sitesSubject$.pipe(
      switchMap(id => this.cutomersService.getSites(id)),
      tap(sites => this.sites = sites)
    ).subscribe();

    this.sharedService.getBranch().subscribe(branch => this.branch_ = branch);

    this.palletsSubject$.pipe(
      tap(() => this.palletsOwing = null),
      switchMap(id => this.palletsService.getPalletsOwedByCustomer(id, this.site)),
    ).subscribe(pallets => this.palletsOwing = pallets);

    this.cagesSubject$.pipe(
      tap(() => this.cages = null),
      switchMap(id => this.recyclingService.getAllCustomerCages(id, this.site)),
      map(cages => {
        const activeCages = cages.filter(_ => _.fields.Status === 'Delivered to customer').map(_ => 1).reduce((acc, curr) => acc + curr, 0);
        const totalWeight = cages.map(_ => +_.fields.NetWeight || 0).reduce((acc, curr) => acc + curr, 0);
        return {count: activeCages, weight: totalWeight};
      })
    ).subscribe(cages => this.cages = cages);
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'print');
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
        this.setTitle(_);
        this.refreshSites(_);
        this.getCustomerAddresses(_);
        this.refreshPallets(_);
        this.refreshCages(_);
      }),
      catchError(
        _ => {
          this.router.navigate(['/customers']);
          return of({} as Customer);
        }
      ),
    );
  }

  getCustomerAddresses(customer: Customer): void {
    this.cutomersService.getCustomerAddresses(customer.custNmbr).subscribe(_ => this.addresses = _);
  }

  refreshSites(customer: Customer): void {
    this.sitesSubject$.next(customer.custNmbr);
  }

  refreshPallets(customer: Customer): void {
    this.palletsSubject$.next(customer.custNmbr);
  }

  refreshCages(customer: Customer): void {
    this.cagesSubject$.next(customer.custNmbr);
  }

  requestCages(customer: Customer): void {
    const message = 'Cage requested for delivery';
    const data = {custNmbr: customer.custNmbr, site: this.site, message};
    this.dialog.open(RunPickerDialogComponent, {width: '600px', data, autoFocus: false});
  }

  openSiteDialog(customer: Customer): void {
    const data = {customer, sites: this.sites};
    const dialogRef = this.dialog.open(CustomerSiteDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshSites(customer));
  }

  openPalletDialog(customer: Customer): void {
    if (!this.sites) return;
    const data = {customer, sites: this.sites, site: this.site};
    const dialogRef = this.dialog.open(PalletDialogComponent, {width: '600px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshPallets(customer));
  }

  openRecyclingDialog(customer: Customer): void {
    if (!this.sites) return;
    const data = {customer, sites: this.sites, site: this.site, branch: this.branch_};
    const dialogRef = this.dialog.open(RecyclingDialogComponent, {width: '800px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe(() => this.refreshCages(customer));
  }

  openRecyclingDocketDialog(customer: Customer): void {
    const data = {customer, addresses: this.addresses, sites: this.sites, site: this.site};
    this.dialog.open(RecyclingDocketDialogComponent, {panelClass: 'printable', width: '800px', data, autoFocus: false});
  }

  openPalletHistory(customer: Customer, pallet = ''): void {
    const data = {customer, pallet, addresses: this.addresses, site: this.site};
    this.dialog.open(PalletCustomerListDialogComponent, {panelClass: 'printable', width: '800px', data, autoFocus: false});
  }

  openCageHistory(customer: Customer): void {
    const data = {customer, addresses: this.addresses, site: this.site};
    this.dialog.open(RecyclingCustomerListDialogComponent, {panelClass: 'printable', width: '800px', data, autoFocus: false});
  }

  setSite(site: string | null): void {
    this.router.navigate([], { queryParams: {site: site}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setTitle(customer: Customer): void {
    this.sharedService.setTitle(`${customer.name} ${this.site ? '(' + this.site + ')' : '' }`);
  }

  goBack(): void {
    this.navService.back();
  }
}
