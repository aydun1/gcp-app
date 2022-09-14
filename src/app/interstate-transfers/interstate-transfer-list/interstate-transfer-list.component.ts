import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, catchError, distinctUntilChanged, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';
import { PurchaseOrderLine } from '../shared/purchase-order-line';

@Component({
  selector: 'gcp-interstate-transfer-list',
  templateUrl: './interstate-transfer-list.component.html',
  styleUrls: ['./interstate-transfer-list.component.css']
})
export class InterstateTransferListComponent implements OnInit {
  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public fromBranchFilter = new FormControl({value: '', disabled: true});
  public toBranchFilter = new FormControl('');
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public creating = false;
  public displayedColumns = [ 'date', 'product', 'quantity', 'cost', 'transfer'];
  public totals!: object;
  public states = this.shared.branches;
  public otherStates!: Array<string>;
  public ownState = '';
  public transferForm!: FormGroup;
  public totalRequestedQty!: number;
  public totalRequestedCost!: number;
  public totalRequestedLines!: number;

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
          this.otherStates = this.states.filter(_ => _ !== state);
          return !params['from'] ? {...params, from: state} : {...params};
        })
      )),
      tap(_ => this.parseParams(_)),
      tap(_ => this.loading = true),
      switchMap(_ => this._loadList ? this.getPurchaseOrders(_) : []),
      tap(_ => this._InterstateTransferSubject$.next(this.makeFormGroup(_))),
      switchMap(_ => this._InterstateTransferSubject$),
    )
  }

  makeFormGroup(lines: Array<PurchaseOrderLine>) {
    this.totalRequestedQty = lines.reduce((acc, cur) => acc + cur.OrderQty, 0);
    this.totalRequestedCost = lines.reduce((acc, cur) => acc + cur.ExtdCost, 0);
    this.totalRequestedLines = lines.reduce((acc, cur) => acc + 1, 0);
    this.lines.clear();
    lines.forEach(_ => 
      this.lines.push(this.fb.group({
        id: [_.Id],
        poNumber: [_.PONumber],
        reqDate: [_.Date],
        itemDesc: [_.ItemDesc],
        itemNumber: [_.ItemNumber],
        orderQty: [_.OrderQty],
        extendedCost: [_.ExtdCost],
        toTransfer: []
      }))
    );
    this.loading = false;
    return this.transferForm;
  }
  
  getPurchaseOrders(params: Params): Observable<PurchaseOrderLine[]> {
    const from = params['from'] || '';
    const to = params['to'] || '';
    if (!from || !to) return of([]);
    return this.interstateTransfersService.getInterstateTransfers(from, to);
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

  createTransfer() {
    this.creating = true;
    const formData = this.lines.value.filter(_ => _.toTransfer);
    this.interstateTransfersService.createTransfer(this.fromBranchFilter.value, this.toBranchFilter.value, formData).pipe(
      tap(() => {
        this.lines.controls.forEach(_ => _.patchValue({toTransfer: null}));
        this.snackBar.open('Successfully created interstate transfer.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
        this.creating = false;
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
        this.creating = false;
        return of();
      })
    ).subscribe();
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

}
