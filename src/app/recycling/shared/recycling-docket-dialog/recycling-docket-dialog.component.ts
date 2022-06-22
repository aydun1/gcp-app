import { Component, HostBinding, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Address } from '../../../customers/shared/address';
import { Customer } from '../../../customers/shared/customer';

import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-recycling-docket-dialog',
  templateUrl: './recycling-docket-dialog.component.html',
  styleUrls: ['./recycling-docket-dialog.component.css']
})
export class RecyclingDocketDialogComponent implements OnDestroy, OnInit {


  public quantities!: {Loscam: number, Chep: number, Plain: number}
  public address!: Address | null;

  constructor(
    public dialogRef: MatDialogRef<RecyclingDocketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, addresses: Address[]},

    private renderer: Renderer2,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    this.address = this.data.addresses.filter(_ => _.addresstypecode === 2)[0]
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }

  print() {
    window.print();
  }

  setAddress(address: Address) {
    this.address = address;
  }
}
