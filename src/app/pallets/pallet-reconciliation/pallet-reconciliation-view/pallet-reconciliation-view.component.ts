import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap, tap } from 'rxjs';

import { SharedService } from 'src/app/shared.service';
import { NavigationService } from '../../../navigation.service';
import { PalletsReconciliationService } from '../../shared/pallets-reconciliation.service';
import { Reconciliation } from '../../shared/reconciliation';

@Component({
  selector: 'gcp-pallet-reconciliation-view',
  templateUrl: './pallet-reconciliation-view.component.html',
  styleUrls: ['./pallet-reconciliation-view.component.css']
})
export class PalletReconciliationViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  public stocktake$!: Observable<Reconciliation>;
  public branch!: string;
  public isRecent = false;

  constructor(
    private route: ActivatedRoute,
    private navService: NavigationService,
    private sharedService: SharedService,
    private reconciliationService: PalletsReconciliationService
  ) { }

  ngOnInit(): void {
    this.sharedService.getBranch().pipe(
      tap(_ => this.branch = _)
    ).subscribe();

    this.stocktake$ = this.route.paramMap.pipe(
      switchMap(params => this.getReconciliation(params.get('id'))),
      tap(_ => this.isRecent = new Date(_.fields.Created).getTime() > Date.now() - (1000 * 60 * 60 * 24 * 7))
    )
  }

  getReconciliation(id: string | null): Observable<Reconciliation> {
    if (!id) return of();
    return this.reconciliationService.getReconciliation(id);
  }

  goBack(): void {
    this.navService.back();
  }
}
