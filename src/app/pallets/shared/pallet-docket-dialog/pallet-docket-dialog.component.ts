import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { Pallet } from '../pallet';
import { PalletsService } from '../pallets.service';

interface PalletQuantity {stateCounts: Array<{name: string, count: number}>, states: Array<string>, total: number};
interface PalletQuantities {
  Loscam: PalletQuantity,
  Chep: PalletQuantity,
  Plain: PalletQuantity,
};

@Component({
  selector: 'gcp-pallet-docket-dialog',
  templateUrl: './pallet-docket-dialog.component.html',
  styleUrls: ['./pallet-docket-dialog.component.css']
})
export class PalletDocketDialogComponent implements OnInit, OnDestroy {

  public transfer!: Pallet;
  public quantities!: PalletQuantities;
  public loading = true;

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private palletService: PalletsService,
    public dialogRef: MatDialogRef<PalletDocketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {id: string},
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    console.log(this.quantities)
    this.route.paramMap.pipe(
      map(params => this.data.id),
      switchMap(id => this.palletService.getPalletTransfer(id)),
      tap(_ => this.transfer = _),
      switchMap(transfer => this.palletService.getPalletsOwedByCustomer(transfer.fields.CustomerNumber, transfer.fields.Site)),
      tap(_ => this.quantities = _),
      tap(() => this.loading = false)
    ).subscribe()
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }

  print() {
    window.print();
  }

}
