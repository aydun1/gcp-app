import { Component, HostBinding, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { Customer } from 'src/app/customers/shared/customer';

import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-recycling-docket-dialog',
  templateUrl: './recycling-docket-dialog.component.html',
  styleUrls: ['./recycling-docket-dialog.component.css']
})
export class RecyclingDocketDialogComponent implements OnDestroy, OnInit {


  public quantities!: {Loscam: number, Chep: number, Plain: number}

  constructor(
    public dialogRef: MatDialogRef<RecyclingDocketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customer: Customer},

    private renderer: Renderer2,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    console.log(this.data.customer);

    ////this.route.paramMap.pipe(
    //  map(params => params.get('id')),
    //  switchMap(id => this.palletService.getPalletTransfer(id)),
    //  tap(_ => this.transfer = _),
    //  switchMap(transfer => this.palletService.getPalletsOwedByCustomer(transfer.fields.CustomerNumber, transfer.fields.Site)),
    //  tap(_ => this.quantities = _)
    //).subscribe()
  }


  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }
}
