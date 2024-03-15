import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable, tap } from 'rxjs';

import { InventoryService } from '../shared/inventory.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { RequiredLine } from '../shared/required-line';
import { GroupByItemPipe } from '../../shared/pipes/group-by-item';
import { TransactionHistoryDialogComponent } from '../shared/transaction-history-dialog/transaction-history-dialog.component';
import { SuggestedItem } from 'src/app/shared/pan-list/suggested-item';

@Component({
  selector: 'gcp-inventory-required',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inventory-required.component.html',
  styleUrls: ['./inventory-required.component.css'],
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, MatButtonModule, MatDividerModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, GroupByItemPipe, LetterheadComponent]
})
export class InventoryRequiredComponent implements OnInit {
  public lineCount!: number;
  public productionRequired!: Observable<RequiredLine[]>;
  public loading = false;

  constructor(
    private dialog: MatDialog,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.productionRequired = this.inventoryService.getProductionRequired().pipe(
      tap(() => this.loading = false)
    );
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

}
