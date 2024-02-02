import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { Site } from '../../../customers/shared/site';
import { Customer } from '../../../customers/shared/customer';
import { SharedService } from '../../../shared.service';
import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';
import { LetterheadComponent } from '../../../shared/letterhead/letterhead.component';
import { LoadingRowComponent } from '../../../shared/loading/loading-row/loading-row.component';

@Component({
  selector: 'gcp-recycling-customer-list-dialog',
  templateUrl: './recycling-customer-list-dialog.component.html',
  styleUrls: ['./recycling-customer-list-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, RouterModule, MatButtonModule, MatDialogModule, MatIconModule, MatTableModule, LetterheadComponent, LoadingRowComponent]
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
    this.cages$ = this.recyclingService.getAllCustomerCages(this.data.customer.custNmbr, site).pipe(
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
