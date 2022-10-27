import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';

import { PurchaseOrder } from '../shared/purchase-order';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';
import { NavigationService } from '../../navigation.service';
import { InTransitTransfer } from '../shared/intransit-transfer';
import { PurchaseOrderLine } from '../shared/purchase-order-line';

@Component({
  selector: 'gcp-interstate-transfer-view',
  templateUrl: './interstate-transfer-view.component.html',
  styleUrls: ['./interstate-transfer-view.component.css']
})
export class InterstateTransferViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  public interstateTransfer$!: Observable<InTransitTransfer>;
  public loading = false;

  constructor(
    private route: ActivatedRoute,
    private navService: NavigationService,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    this.interstateTransfer$ = this.route.paramMap.pipe(
      switchMap(params => this.getInterstateTransfer(params.get('ittId')))
    )
  }

  getInterstateTransfer(id: string | null): Observable<InTransitTransfer> {
    if (!id) return of();
    return this.interstateTransfersService.getInTransitTransfer(id);
  }

  goBack(): void {
    this.navService.back();
  }

  print(): void {
    window.print();
  }

  trackByFn(index: number, item: PurchaseOrderLine): string {
    return item.Id;
  }

}
