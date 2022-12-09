import { Component, HostBinding, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, concatMap, delay, Observable, of, retry, retryWhen, switchMap, take, tap, throwError } from 'rxjs';

import { InterstateTransfersService } from '../shared/interstate-transfers.service';
import { NavigationService } from '../../navigation.service';
import { InTransitTransfer } from '../shared/intransit-transfer';
import { PurchaseOrderLine } from '../shared/purchase-order-line';

@Component({
  selector: 'gcp-interstate-transfer-view',
  templateUrl: './interstate-transfer-view.component.html',
  styleUrls: ['./interstate-transfer-view.component.css']
})
export class InterstateTransferViewComponent implements OnDestroy, OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  public interstateTransfer$!: Observable<InTransitTransfer>;
  public loading = false;
  public error!: string;

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private navService: NavigationService,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    this.interstateTransfer$ = this.route.paramMap.pipe(
      switchMap(params => this.getInterstateTransfer(params.get('ittId')))
    )
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'print');
  }

  getInterstateTransfer(id: string | null): Observable<InTransitTransfer> {
    if (!id) return of();
    return this.interstateTransfersService.getInTransitTransfer(id).pipe(
      retry({count: 10, delay: 2000}),
      catchError(_ => {
        console.log(_);
        this.error = `Unable to load ${id} from GP right now. It is likely still importing. Please check again later.`;
        return of();
      })
    );
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
