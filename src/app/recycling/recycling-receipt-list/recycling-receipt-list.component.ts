import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Receipt } from '../shared/receipt';
import { RecyclingReceiptsService } from '../shared/recycling-receipts.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';

@Component({
  selector: 'gcp-recycling-receipt-list',
  templateUrl: './recycling-receipt-list.component.html',
  styleUrls: ['./recycling-receipt-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, NgForOf, NgIf, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatSelectModule, MatTableModule, LetterheadComponent]
})
export class RecyclingReceiptListComponent implements OnInit {
  private _loadList!: boolean;
  public branchFilter = new FormControl('');
  public displayedColumns = ['date', 'receiptNumber', 'branch', 'weight'];
  public weight!: number;
  public receipts$!: Observable<Receipt[]>;
  public states = this.sharedService.branches;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private receiptsService: RecyclingReceiptsService
  ) { }

  ngOnInit(): void {
    this.receipts$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      tap(() => this.weight = 0),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(receipts => this.weight = receipts.map(_ => _.fields.NetWeight).filter(_ => _).reduce((acc, val) => acc + val, 0))
    )
  }

  getFirstPage(_: Params): BehaviorSubject<Receipt[]> {
    return this.receiptsService.getFirstPage(_);
  }

  getNextPage(): void {
    this.receiptsService.getNextPage();
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters = {} as {branch: string};
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
      filters['branch'] = params['branch'];
    } else {
      this.branchFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameBranch = prev['branch'] === curr['branch'];
    return sameBranch && this._loadList;
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByFn(index: number, item: Receipt): string {
    return item.id;
  }
}
