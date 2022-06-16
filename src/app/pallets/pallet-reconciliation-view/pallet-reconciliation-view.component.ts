import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';

import { NavigationService } from '../../navigation.service';
import { PalletsReconciliationService } from '../shared/pallets-reconciliation.service';
import { Reconciliation } from '../shared/reconciliation';

@Component({
  selector: 'gcp-pallet-reconciliation-view',
  templateUrl: './pallet-reconciliation-view.component.html',
  styleUrls: ['./pallet-reconciliation-view.component.css']
})
export class PalletReconciliationViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';

  public stocktake$!: Observable<Reconciliation>;

  constructor(
    private route: ActivatedRoute,
    private navService: NavigationService,
    private reconciliationService: PalletsReconciliationService
  ) { }

  ngOnInit(): void {
    this.stocktake$ = this.route.paramMap.pipe(
      switchMap(params => this.getReconciliation(params.get('id'))
    ))
  }

  getReconciliation(id: string | null): Observable<Reconciliation> {
    if (!id) return of();
    return this.reconciliationService.getReconciliation(id);
  }

  goBack(): void {
    this.navService.back();
  }
}
