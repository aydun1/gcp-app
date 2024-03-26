import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, debounceTime, map, switchMap, tap } from 'rxjs';

import { InventoryService } from '../shared/inventory.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { RequiredLine } from '../shared/required-line';
import { GroupByItemPipe } from '../../shared/pipes/group-by-item';
import { TransactionHistoryDialogComponent } from '../shared/transaction-history-dialog/transaction-history-dialog.component';
import { SuggestedItem } from '../../shared/pan-list/suggested-item';

@Component({
  selector: 'gcp-inventory-required',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inventory-required.component.html',
  styleUrls: ['./inventory-required.component.css'],
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, ReactiveFormsModule, MatButtonModule, MatDividerModule, MatIconModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, GroupByItemPipe, LetterheadComponent]
})
export class InventoryRequiredComponent implements OnInit {
  private loadList!: boolean;
  public lineCount!: number;
  public productionRequired!: Observable<RequiredLine[]>;
  public loading = false;
  public textFilter = new FormControl(this.route.snapshot.queryParamMap.get('search'));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.productionRequired = this.inventoryService.getProductionRequired().pipe(
      switchMap(_ => this.route.queryParams.pipe(
        map(p => _.filter(i => i.ITEMNMBR.includes((p['search'] || '').toLocaleUpperCase())))
      )),
      tap(() => this.loading = false)
    );

    this.textFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _ && _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'search': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this.loadList && this.route.children.length === 0) {
      this.loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameSearch = prev['search'] === curr['search'];
    return this.loadList && sameSearch;
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('search' in params) {
      this.textFilter.patchValue(params['search']);
    } else {
      if (this.textFilter.value) this.textFilter.patchValue('');
    }
  }

  openDialog(line: any): void {
    const item: Partial<SuggestedItem> = {
      ItemNmbr: line.ITEMNMBR || line.itemNmbr,
      ItemDesc: line.ITEMDESC || line.description,
      MaxOrderQty: line.MAX,
      MinOrderQty: line.MIN
    }
    this.dialog.open(TransactionHistoryDialogComponent, {
      autoFocus: false,
      width: '800px',
      data: {itemNmbr: item.ItemNmbr, branch: line.LOCNCODE || '', item, warn: false}
    });
  }

  clearTextFilter(): void {
    this.textFilter.patchValue('');
  }
}
