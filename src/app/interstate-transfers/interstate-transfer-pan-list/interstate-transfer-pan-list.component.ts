import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';
import { SuggestedItem } from '../shared/suggested-item';

@Component({
  selector: 'gcp-interstate-pan-transfer-list',
  templateUrl: './interstate-transfer-pan-list.component.html',
  styleUrls: ['./interstate-transfer-pan-list.component.css']
})
export class InterstateTransferPanListComponent implements OnInit {
  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public branchFilter = new FormControl({value: '', disabled: false});
  public viewFilter = new FormControl('');
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public creating = false;
  public displayedColumns = [ 'date', 'product', 'available', 'quantity', 'toFill', 'transfer'];
  public totals!: object;
  public states = this.shared.branches;
  public ownState = '';
  public transferForm!: FormGroup;

  public get otherStates(): Array<string> {
    return this.states.filter(_ => _ !== this.branchFilter.value);
  }

  public get lines(): FormArray<FormGroup> {
    return this.transferForm.get('lines') as FormArray;
  }

  public get transferQty(): number {
    return this.lines.value.reduce((acc, cur) => acc + cur['toTransfer']
  , 0);
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();
    this.transferForm = this.fb.group({
      lines: this.fb.array([]),
    });

    this.interstateTransfers$ = this.route.queryParams.pipe(
      startWith({}),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(
        map(state => {
          this.ownState = state;
          return !params['branch'] ? {...params, branch: state} : {...params};
        })
      )),
      tap(_ => this.parseParams(_)),
      tap(_ => this.loading = true),
      switchMap(_ => this._loadList ? this.getPurchaseOrders(_) : []),
      tap(_ => this._InterstateTransferSubject$.next(this.makeFormGroup(_))),
      switchMap(_ => this._InterstateTransferSubject$),
    )
  }

  makeFormGroup(lines: Array<SuggestedItem>) {
    this.lines.clear();
    let i = -1;
    lines.forEach(_ => 
      this.lines.push(this.fb.group({
        index: [i += 1],
        id: [_.Id],
        itemDesc: [_.ItemDesc],
        itemNumber: [_.ItemNumber],
        bin: [_.Bin?.replace('QLD BIN', '')],
        palletQty: [_.PalletQty],
        packSize: [_.PackSize == _.PalletQty ? '-' : _.PackSize],
        vicOnHand: [_.VicOnHand],
        qtyRequired: [Math.max(0, _.QtyRequired) || null],
        toFill: [_.Max ? _.QtyRequired + _.Max : null],
        toTransfer: []
      }))
    );
    this.loading = false;
    return this.transferForm;
  }
  
  getPurchaseOrders(params: Params): Observable<SuggestedItem[]> {
    const branch = params['branch'] || '';
    console.log(branch);
    if (!branch) return of([]);
    return this.interstateTransfersService.getPanList(branch);
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
      filters['branch'] = params['branch'];
    } else {
      this.branchFilter.patchValue(this.states[0]);
    }
    if ('view' in params) {
      this.viewFilter.patchValue(params['view']);
    } else {
      this.viewFilter.patchValue('ungrouped');
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

  setView(view: MatSelectChange): void {
    this.router.navigate([], { queryParams: {view: view.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalQtyOnHand(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.qtyOnHand, 0);
  }

  getTotalRequiredQty(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.qtyRequired, 0);
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  getTotalToTransfer(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.toTransfer, 0);
  }

  trackByGroupsFn(index: number, item: any): string {
    return item.key;
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

}
