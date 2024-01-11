import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';

import { Site } from '../../../customers/shared/site';
import { Customer } from '../../../customers/shared/customer';
import { SharedService } from '../../../shared.service';
import { Pallet } from '../pallet';
import { PalletsService } from '../pallets.service';
import { LetterheadComponent } from '../../../shared/letterhead/letterhead.component';
import { LoadingRowComponent } from '../../../shared/loading/loading-row/loading-row.component';

@Component({
  selector: 'gcp-pallet-customer-list-dialog',
  templateUrl: './pallet-customer-list-dialog.component.html',
  styleUrls: ['./pallet-customer-list-dialog.component.css'],
  standalone: true,
  imports: [NgForOf, NgIf, AsyncPipe, DatePipe, MatButtonModule, MatDialogModule, MatIconModule, MatMenuModule, MatTableModule, LetterheadComponent, LoadingRowComponent]
})
export class PalletCustomerListDialogComponent implements OnInit, OnDestroy {
  public pallets$!: Observable<Pallet[]>;
  public branchFilter = new FormControl('');
  public palletFilter = new FormControl('');
  public loading$ = new BehaviorSubject<boolean>(true);
  public totalOut = 0;
  public totalIn = 0;
  public states = this.sharedService.branches;
  public palletTypes = this.sharedService.pallets;
  public palletType!: string;
  public displayedColumns = ['date', 'notes', 'pallet', 'in', 'out', 'docket'];
  public date = new Date();

  get filteredPalletTypes() {
    return this.palletType ? this.displayedColumns.filter(_ => _ !== 'pallet') : this.displayedColumns;
  }
  constructor(
    private renderer: Renderer2,
    public dialogRef: MatDialogRef<PalletCustomerListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string, pallet: string},
    private palletsService: PalletsService,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print-dialog');
    if (this.data.pallet) this.palletType = this.data.pallet;
    this.getCustomerPallets();
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print-dialog');
  }

  getCustomerPallets(): void {
    this.loading$.next(true);
    const pallet = this.palletType || '';
    const site = this.data.site || '';
    this.pallets$ = this.palletsService.getCustomerPallets(this.data.customer.custNmbr, pallet, site).pipe(
      tap(() => {
        this.loading$.next(false);
        this.totalIn = 0;
        this.totalOut = 0;
      }),
      map(_=>
        _.map(pallet =>  {
          const isSource = pallet.fields.From === this.branchFilter.value;
          pallet.fields['In'] = this.data.customer.custNmbr ? +pallet.fields.In || 0 : isSource ? 0 : +pallet.fields.Quantity;
          pallet.fields['Out'] = this.data.customer.custNmbr ? +pallet.fields.Out || 0 : isSource ? +pallet.fields.Quantity : 0;
          pallet.fields['Change'] = pallet.fields['Out'] - pallet.fields['In'];
          this.totalIn += pallet.fields['In'];
          this.totalOut += pallet.fields['Out'];
          return pallet;
        })
      ),
      catchError(
        _ => {
          this.loading$.next(false);
          return of([] as Pallet[]);
        }
      ),
    );
  }

  setBranch(branch: MatSelectChange): void {
    console.log(branch);
  }

  setPallet(palletType: string): void {
    this.palletType = palletType;
    this.getCustomerPallets();
  }

  print() {
    window.print();
  }

  trackByFn(index: number, item: Pallet): string {
    return item.id;
  }

}
