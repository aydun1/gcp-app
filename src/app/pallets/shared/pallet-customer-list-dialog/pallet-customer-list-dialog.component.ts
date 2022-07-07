import { Component, ElementRef, HostListener, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { Site } from 'src/app/customers/shared/site';

import { Customer } from '../../../customers/shared/customer';
import { SharedService } from '../../../shared.service';
import { Pallet } from '../pallet';
import { PalletsService } from '../pallets.service';

@Component({
  selector: 'gcp-pallet-customer-list-dialog',
  templateUrl: './pallet-customer-list-dialog.component.html',
  styleUrls: ['./pallet-customer-list-dialog.component.css']
})
export class PalletCustomerListDialogComponent implements OnInit {
  private _loadList!: boolean;
  public pallets$!: Observable<Pallet[]>;
  public branchFilter = new FormControl('');
  public palletFilter = new FormControl('');
  public loading = this.palletsService.loading;
  public totalOut = 0;
  public totalIn = 0;
  public states = this.sharedService.branches;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public displayedColumns = ['date', 'notes', 'pallet', 'in', 'out', 'docket'];


  constructor(
    public dialogRef: MatDialogRef<PalletCustomerListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string},
    private palletsService: PalletsService,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.getCustomerPallets();
  }

  getCustomerPallets(): void {
    const pallet = this.palletFilter.value || '';
    this.pallets$ = this.palletsService.getCustomerPallets(this.data.customer.accountnumber, pallet, '').pipe(
      tap(() => {
          this.totalIn = 0;
          this.totalOut = 0;
        }
      ),
      map(_=>
        _.map(pallet =>  {
          const isSource = pallet.fields.From === this.branchFilter.value;
          pallet.fields['In'] = this.data.customer.accountnumber ? +pallet.fields.In || 0 : isSource ? 0 : +pallet.fields.Quantity;
          pallet.fields['Out'] = this.data.customer.accountnumber ? +pallet.fields.Out || 0 : isSource ? +pallet.fields.Quantity : 0;
          pallet.fields['Change'] = pallet.fields['Out'] - pallet.fields['In'];
          this.totalIn += pallet.fields['In'];
          this.totalOut += pallet.fields['Out'];
          return pallet;
        })
      )
    );
  }

  setBranch(branch: MatSelectChange): void {
    console.log(branch);
  }

  setPallet(pallet: MatSelectChange): void {
    this.getCustomerPallets();
  }

  trackByFn(index: number, item: Pallet): string {
    return item.id;
  }

}
