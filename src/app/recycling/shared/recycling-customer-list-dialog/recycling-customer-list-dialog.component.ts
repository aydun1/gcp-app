import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Observable, startWith, Subject, tap } from 'rxjs';

import { Site } from '../../../customers/shared/site';
import { Customer } from '../../../customers/shared/customer';
import { SharedService } from '../../../shared.service';
import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-recycling-customer-list-dialog',
  templateUrl: './recycling-customer-list-dialog.component.html',
  styleUrls: ['./recycling-customer-list-dialog.component.css']
})
export class RecyclingCustomerListDialogComponent implements OnInit, OnDestroy {
  public cages$!: Observable<Cage[]>;
  public loading$ = new BehaviorSubject<boolean>(true);
  public netWeight = 0;
  public states = this.sharedService.branches;
  public displayedColumns = ['date', 'cage-number', 'asset-type', 'status', 'net-weight'];


  constructor(
    private renderer: Renderer2,
    public dialogRef: MatDialogRef<RecyclingCustomerListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string},
    private recyclingService: RecyclingService,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print-dialog');
    this.getCustomerCages();
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print-dialog');
  }

  getCustomerCages(): void {
    this.loading$.next(true);
    const site = this.data.site || '';
    this.cages$ = this.recyclingService.getCagesWithCustomer(this.data.customer.accountnumber, site).pipe(
      tap(_ => {
        this.netWeight = 0;
        _.forEach(cage => this.netWeight += +cage.fields['NetWeight'] || 0);
        this.loading$.next(false);
      })
    );
  }

  print() {
    window.print();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  trackByFn(index: number, item: Cage): string {
    return item.id;
  }

}