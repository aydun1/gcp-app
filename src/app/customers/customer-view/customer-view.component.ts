import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { CustomersService } from '../shared/customers.service';
import { PalletDialogComponent } from '../shared/pallet-dialog/pallet-dialog.component';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnInit {
  private id: string;
  private navigationSubscription: Subscription;
  public customer$: Observable<any>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private cutomersService: CustomersService
  ) { }

  ngOnInit(): void {
    this.customer$ = this.getCustomer();

    this.navigationSubscription = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      tap(_ => {if (this.id !==  this.route.snapshot.paramMap.get('id')) this.customer$ = this.getCustomer()})
    ).subscribe()

  }

  ngOnDestroy() {
    this.navigationSubscription.unsubscribe();
  }

  getCustomer() {
    this.id = this.route.snapshot.paramMap.get('id');
    return this.cutomersService.getCustomer(this.id);
  }

  openPalletDialog() {
    const data = {title: 'Set newbie', content: 'Set the member as a newbie.'};

    const dialogRef = this.dialog.open(PalletDialogComponent, {
      width: '800px',
      data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      //this.loading = true;
      //this.memberService.setMemberAsNewbie(this.id).then(_ => this.onComplete(_)).catch(_ => this.onComplete(_));
    });
  }
}
