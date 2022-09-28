import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { PanListService } from '../pan-list.service';
import { RequestLine } from '../request-line';

@Component({
  selector: 'gcp-pan-list-simple',
  templateUrl: './pan-list-simple.component.html',
  styleUrls: ['./pan-list-simple.component.css']
})
export class PanListSimpleComponent implements OnInit {
  @Input() panLists!: Array<number[]>;
  @Output() addPanList = new EventEmitter<boolean>();
  @Input() scheduleId!: string;
  @Input()
  get panListId(): string { return this._panListId; }
  set panListId(value: string) {
    this._panListId = value;
  }
  private _panListId!: string;

  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public creating = false;
  public totals!: object;
  public states = this.shared.branches;
  public ownState = '';
  public transferForm!: FormGroup;
  public columns = ['product', 'transfer'];
  public panList: number | null = null;
  public selectedPan!: number;

  public get displayedColumns(): Array<string> {
    return this.columns;
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
    private shared: SharedService,
    private panListService: PanListService
  ) { }

  ngOnInit(): void {
    this.transferForm = this.fb.group({
      lines: this.fb.array([]),
    });

    this.interstateTransfers$ = this.route.queryParams.pipe(
      startWith({}),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      tap(_ => this.loading = true),
      switchMap(_ => this._loadList ? this.getRequestedQuantities(_) : []),
      tap(_ => this._InterstateTransferSubject$.next(this.makeFormGroup(_))),
      switchMap(_ => this._InterstateTransferSubject$),
    )
  }

  makeFormGroup(lines: Array<RequestLine>): FormGroup<any> {
    this.lines.clear();
    let i = -1;
    lines.forEach(_ => {
      const formGroup = this.fb.group({
        index: [i += 1],
        id: [_.id],
        itemNumber: [_.fields.ItemNumber],
        itemDescription: [_.fields.ItemDescription],
        toTransfer: new FormControl({value: _.fields.Quantity, disabled: false})
      });
      formGroup.valueChanges.pipe(
        debounceTime(1000),
        tap(_ => this.updatePanList(_.itemNumber, _.itemDescription, _.toTransfer))
      ).subscribe();
      this.lines.push(formGroup);
    });
    this.loading = false;
    console.log(this.transferForm)
    return this.transferForm;
  }
  
  getRequestedQuantities(params: Params): Observable<RequestLine[]> {
    if (!params['pan']) return of([]);
    return this.panListService.getRequestedQuantities(this.scheduleId, params['pan']);
  }

  updatePanList(itemNumber: string | null | undefined, itemDescription: string | null | undefined, quantity: number | null | undefined) {
    if (!itemNumber) return;
    this.panListService.setRequestedQuantities(quantity, itemNumber, itemDescription, this.scheduleId, 1);
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
    if ('pan' in params) {
      this.selectedPan = params['pan'];
      filters['pan'] = params['pan'];
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (this.route.children.length) {
      this._loadList = false;
    }
    if (!this._loadList) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const samePan = prev['pan'] === curr['pan'];
    return this._loadList && samePan;
  }

  setPan(panId: MatButtonToggleChange): void {
    this.router.navigate([], { queryParams: {pan: panId.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setCategories(categories: MatSelectChange): void {
    this.router.navigate([], { queryParams: {categories: categories.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setSuppliers(suppliers: MatSelectChange): void {
    this.router.navigate([], { queryParams: {suppliers: suppliers.value}, queryParamsHandling: 'merge', replaceUrl: true});
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


  trackByFn(index: number, item: any): string {
    return item.id;
  }

}
