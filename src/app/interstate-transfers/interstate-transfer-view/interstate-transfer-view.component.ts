import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { NavigationService } from 'src/app/navigation.service';

import { SharedService } from '../../shared.service';
import { PurchaseOrder } from '../shared/purchase-order';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';

@Component({
  selector: 'gcp-interstate-transfer-view',
  templateUrl: './interstate-transfer-view.component.html',
  styleUrls: ['./interstate-transfer-view.component.css']
})
export class InterstateTransferViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  public interstateTransfer$!: Observable<PurchaseOrder>;
  public loading = false;

  constructor(
    private route: ActivatedRoute,
    private navService: NavigationService,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    this.interstateTransfer$ = this.route.paramMap.pipe(
      switchMap(params => this.getInterstateTransfer(params.get('id')))
    )
  }

  getInterstateTransfer(id: string | null): Observable<PurchaseOrder> {
    if (!id) return of();
    return this.interstateTransfersService.getPurchaseOrder(id);
  }

  goBack(): void {
    this.navService.back();
  }

  trackByFn(index: number, item: PurchaseOrder): string {
    return item.PONumber;
  }

}
