import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { InventoryService } from '../shared/inventory.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { GroupByPropertyPipe } from '../../shared/pipes/group-by-property';

@Component({
  selector: 'gcp-inventory-requested',
  templateUrl: './inventory-requested.component.html',
  styleUrls: ['./inventory-requested.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterModule, MatCardModule, MatProgressSpinnerModule, MatSelectModule, MatTableModule, LetterheadComponent, GroupByPropertyPipe]
})
export class InventoryRequestedComponent implements OnInit {
  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public fromBranchFilter = new FormControl({value: '', disabled: true});
  public toBranchFilter = new FormControl('');
  public viewFilter = new FormControl('');
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public displayedColumns = [ 'date', 'product', 'available', 'quantity'];
  public states = this.shared.branches;
  public transferForm = this.fb.group({
    lines: this.fb.array([])
  });
  public get otherBranches(): Array<string> {
    return this.states.filter(_ => _ !== this.fromBranchFilter.value);
  }

  public get lines(): FormArray<FormGroup> {
    return this.transferForm.get('lines') as FormArray;
  }

  public get transferQty(): number {
    return this.lines.value.reduce((acc, cur) => acc + cur['toTransfer'], 0);
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();
    this.interstateTransfers$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(map(state => !params['from'] ? {...params, from: state} : params))),
      tap(_ => this.parseParams(_)),
      tap(_ => this.loading = true),
      switchMap(_ => this._loadList ? this.getInterstateTransfers(_) : []),
      tap(_ => this._InterstateTransferSubject$.next(this.makeFormGroup(_))),
      switchMap(_ => this._InterstateTransferSubject$),
    )
  }

  makeFormGroup(lines: Array<any>): FormGroup<any> {
    this.lines.clear();
    let i = -1;
    lines.forEach(_ =>
      this.lines.push(this.fb.group({
        index: [i += 1],
        id: [_.Id],
        docId: [_.DocId],
        lineNumber: [_.LineNumber],
        orderDate: [_.OrderDate],
        etaDate: [_.EtaDate],
        itemDesc: [_.ItemDesc],
        itemNumber: [_.ItemNmbr],
        transferQty: [_.TransferQty],
        qtyFulfilled: [_.TransferQty - _.QtyShipped],
        QtyShipped: [_.QtyShipped],
        qtyAvailable: [_.QtyAvailable],
        qtyOnHand: [_.QtyOnHand],
        toSite: [_.ToSite],
        toTransfer: []
      }))
    );
    this.loading = false;
    return this.transferForm;
  }

  getInterstateTransfers(params: Params): Observable<any[]> {
    const from = params['from'] || '';
    const to = params['to'] || '';
    if (!from) return of([]);
    return this.inventoryService.getInterstateTransfers(from, to);
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
    if ('to' in params) {
      this.toBranchFilter.patchValue(params['to']);
      filters['to'] = params['to'];
    } else {
      this.toBranchFilter.patchValue('');
    }
    if ('from' in params) {
      this.fromBranchFilter.patchValue(params['from']);
      filters['from'] = params['from'];
    } else {
      this.fromBranchFilter.patchValue(this.states[0]);
    }
    if ('view' in params) {
      this.viewFilter.patchValue(params['view']);
    } else {
      this.viewFilter.patchValue('grouped');
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameFromBranch = prev['from'] === curr['from'];
    const sameToBranch = prev['to'] === curr['to'];
    return sameFromBranch && sameToBranch && this._loadList;
  }

  setFromBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {from: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setToBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {to: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setView(view: MatSelectChange): void {
    this.router.navigate([], { queryParams: {view: view.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalQtyOnHand(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.qtyOnHand, 0);
  }

  getTotalRequestedQty(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.transferQty, 0);
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

}
