import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { Pallet } from '../pallet';
import { PalletsService } from '../pallets.service';

@Component({
  selector: 'gcp-pallet-docket-dialog',
  templateUrl: './pallet-docket-dialog.component.html',
  styleUrls: ['./pallet-docket-dialog.component.css']
})
export class PalletDocketDialogComponent implements OnInit, OnDestroy {

  public transfer!: Pallet;
  public quantities!: {Loscam: number, Chep: number, Plain: number};

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private palletService: PalletsService,
    public dialogRef: MatDialogRef<PalletDocketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {id: string},
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');

    this.route.paramMap.pipe(
      map(params => this.data.id),
      switchMap(id => this.palletService.getPalletTransfer(id)),
      tap(_ => this.transfer = _),
      switchMap(transfer => this.palletService.getPalletsOwedByCustomer(transfer.fields.CustomerNumber, transfer.fields.Site)),
      tap(_ => this.quantities = _)
    ).subscribe()
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }

  print() {
    window.print();
  }

}
