import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map, switchMap, tap } from 'rxjs';

import { Pallet } from '../pallet';
import { PalletsService } from '../pallets.service';
import { LetterheadComponent } from '../../../shared/letterhead/letterhead.component';

interface PalletQuantity {stateCounts: Array<{name: string, count: number}>, states: Array<string>, total: number};
interface PalletQuantities {
  Loscam: PalletQuantity;
  Chep: PalletQuantity;
  GCP: PalletQuantity;
  Plain: PalletQuantity;
  [key: string]: PalletQuantity;
};

@Component({
  selector: 'gcp-pallet-docket-dialog',
  templateUrl: './pallet-docket-dialog.component.html',
  styleUrls: ['./pallet-docket-dialog.component.css'],
  standalone: true,
  imports: [NgForOf, NgIf, TitleCasePipe, MatButtonModule, MatDialogModule, MatIconModule, MatListModule, MatProgressSpinnerModule, LetterheadComponent]
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
