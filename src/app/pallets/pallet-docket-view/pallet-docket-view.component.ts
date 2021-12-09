import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { Pallet } from '../shared/pallet';
import { PalletsService } from '../shared/pallets.service';

@Component({
  selector: 'gcp-pallet-docket-view',
  host: {class:'app-component'},
  templateUrl: './pallet-docket-view.component.html',
  styleUrls: ['./pallet-docket-view.component.css']
})
export class PalletDocketViewComponent implements OnInit {

  public transfer: Pallet;
  public quantities: {Loscam: number, Chep: number, Plain: number}

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private palletService: PalletsService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');

    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => this.palletService.getPalletTransfer(id)),
      tap(_ => this.transfer = _),
      switchMap(transfer => this.palletService.getCustomerPalletQuantities(transfer.fields.CustomerNumber, transfer.fields.Site)),
      tap(_ => this.quantities = _)
    ).subscribe()
  }


  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }
}
