import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { CustomersService } from '../shared/customers.service';
import { PalletDialogComponent } from '../shared/pallet-dialog/pallet-dialog.component';
import { RecyclingDialogComponent } from '../shared/recycling-dialog/recycling-dialog.component';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnInit {
  private id: string;
  private navigationSubscription: Subscription;
  private palletsSubject$ = new Subject<string>();
  public customer$: Observable<any>;
  public pallets: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private dialog: MatDialog,
    private cutomersService: CustomersService
  ) { }

  ngOnInit(): void {
    this.customer$ = this.getCustomer();

    this.palletsSubject$.pipe(
      switchMap(id => this.cutomersService.getPallets(id)),
      map(pallets => {
        const loscams = pallets.filter(_ => _.fields.Pallet === 'Loscam').reduce((acc, curr) => acc + parseInt(curr.fields.Change), 0);
        const cheps = pallets.filter(_ => _.fields.Pallet === 'Chep').reduce((acc, curr) => acc + parseInt(curr.fields.Change), 0);
        const plains =pallets.filter(_ => _.fields.Pallet === 'Plain').reduce((acc, curr) => acc + parseInt(curr.fields.Change), 0);
        return {pallets, loscams, cheps, plains};
      })
    ).subscribe(pallets => this.pallets = pallets);

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
      tap(_ => this.refreshPallets(_.accountnumber))
    );
  }

  refreshPallets(id: string) {
    this.palletsSubject$.next(id);
  }

  openPalletDialog(customer: string) {
    const data = {customer};
    const dialogRef = this.dialog.open(PalletDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPallets(data.customer);
      if (!result) return;
    });
  }

  openRecyclingDialog(customer: string) {
    const data = {customer};
    const dialogRef = this.dialog.open(RecyclingDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
    });
  }

  goBack() {
    this.location.back();
  }
}
