import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';

import { Address } from '../../../customers/shared/address';
import { Customer } from '../../../customers/shared/customer';
import { Cage } from '../cage';

import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-recycling-docket-dialog',
  templateUrl: './recycling-docket-dialog.component.html',
  styleUrls: ['./recycling-docket-dialog.component.css']
})
export class RecyclingDocketDialogComponent implements OnDestroy, OnInit {
  public quantities!: {Loscam: number, Chep: number, Plain: number}
  public address!: Address | null;
  public cages$!: Observable<Cage[]>;
  public cageTypes = {
    solid: [] as Array<number>,
    folding: [] as Array<number>,
    other: 0
  }

  constructor(
    public dialogRef: MatDialogRef<RecyclingDocketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, addresses: Address[]},

    private renderer: Renderer2,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print-dialog');
    this.address = this.data.addresses.filter(_ => _.addresstypecode === 2)[0];
    this.cages$ = this.recyclingService.getActiveCagesWithCustomer(this.data.customer.accountnumber).pipe(
      tap(_ => _.forEach(cage => {
        if (cage.fields.AssetTypeClean === 'Solid cage') this.cageTypes.solid.push(cage.fields.CageNumber);
        else if (cage.fields.AssetTypeClean === 'Folding cage') this.cageTypes.folding.push(cage.fields.CageNumber);
        else this.cageTypes.other += 1;
      }))
    );
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print-dialog');
  }

  print() {
    window.print();
  }

  setAddress(address: Address) {
    this.address = address;
  }
}
