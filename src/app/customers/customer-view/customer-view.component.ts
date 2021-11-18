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

@Component({
  selector: 'gcp-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnInit {
  private id: string;
  private navigationSubscription: Subscription;
  private palletsSubject$ = new Subject<string>();
  private cagesSubject$ = new Subject<string>();
  public customer$: Observable<any>;
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

    this.palletsSubject$.pipe(
      switchMap(id => this.palletsService.getCustomerPallets(id)),
      map(pallets => {
        const loscams = pallets.filter(_ => _.fields.Pallet === 'Loscam').reduce((acc, curr) => acc + parseInt(curr.fields.Change), 0);
        const cheps = pallets.filter(_ => _.fields.Pallet === 'Chep').reduce((acc, curr) => acc + parseInt(curr.fields.Change), 0);
        const plains = pallets.filter(_ => _.fields.Pallet === 'Plain').reduce((acc, curr) => acc + parseInt(curr.fields.Change), 0);
        return {pallets, loscams, cheps, plains};
      })
    ).subscribe(pallets => this.pallets = pallets);

    this.cagesSubject$.pipe(
      switchMap(id => this.recyclingService.getCagesWithCustomer(id)),
      map(cages => {
        const weight = cages.map(_ => _.fields.Weight || 0).reduce((acc, curr) => acc + curr, 0);
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
      tap(_ => this.refreshPallets(_.accountnumber)),
      tap(_ => this.refreshCages(_.accountnumber))
    );
  }

  refreshPallets(id: string) {
    this.palletsSubject$.next(id);
  }

  refreshCages(id: string) {
    this.cagesSubject$.next(id);
  }

  openPalletDialog(customer: string) {
    const data = {customer};
    const dialogRef = this.dialog.open(PalletDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPallets(data.customer);
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

  goBack() {
    this.location.back();
  }
}
