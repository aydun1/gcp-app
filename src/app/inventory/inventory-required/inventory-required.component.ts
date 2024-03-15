import { AsyncPipe, DecimalPipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';

import { InventoryService } from '../shared/inventory.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { RequiredLine } from '../shared/required-line';
import { GroupByItemPipe } from '../../shared/pipes/group-by-item';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'gcp-inventory-required',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inventory-required.component.html',
  styleUrls: ['./inventory-required.component.css'],
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, MatButtonModule, MatDividerModule, MatInputModule, MatSelectModule, GroupByItemPipe, LetterheadComponent]
})
export class InventoryRequiredComponent implements OnInit {
  public lineCount!: number;
  public productionRequired!: Observable<RequiredLine[]>;

  constructor(
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.productionRequired = this.inventoryService.getProductionRequired();
  }

}
