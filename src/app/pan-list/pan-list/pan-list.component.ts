import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatTable } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { TransactionHistoryDialogComponent } from 'src/app/interstate-transfers/transaction-history-dialog/transaction-history-dialog.component';

import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { PanListService } from '../pan-list.service';
import { RequestLine } from '../request-line';
import { SuggestedItem } from '../suggested-item';

@Component({
  selector: 'gcp-pan-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pan-list.component.html',
  styleUrls: ['./pan-list.component.css']
})
export class PanListComponent implements OnInit {

  @ViewChild(MatTable) _matTable!:MatTable<any>;

  @Input() autosave!: boolean;
  @Input() defaultCategories: Array<string> = [];
  @Input() defaultColumns: Array<string> = [];
  @Input() showSuppliers: boolean = true;
  @Input() showNotes: boolean = false;
  @Input() estimatePallets: boolean = false;
  @Input() min = 'MinOrderQty';
  @Input() max = 'MaxOrderQty';
  @Output() saveClicked: EventEmitter<FormGroup> = new EventEmitter();
  @Output() lineCount: EventEmitter<number> = new EventEmitter();
  @Output() activeLines: EventEmitter<any[]> = new EventEmitter();

  private _scheduleId!: string;
  private _panId!: number;
  private _loadList!: boolean;

  public itemSearch = new FormControl<SuggestedItem | null>(null);
  public branchFilter = new FormControl({value: '', disabled: true});
  public viewFilter = new FormControl('');
  public loading = false;
  public creating = false;
  public chosenColumns: Array<string> = [];
  public chosenVendors: Array<string> = [];
  public categories: Array<string> = [];
  public totals!: object;
  public states = this.shared.branches;
  public ownState = '';
  public transferForm!: FormGroup;
  public hideNoStockVic = false;
  public hideNoStockNsw = false;
  public hideNoStockQld = false;
  public hideNoStockSa = false;
  public hideNoStockWa = false;
  public hideUnrequireds = false;
  public hideUnsuggesteds = false;
  public hideNoMaxes = false;
  public saving = new Subject<string>();
  public columns = [ 'bin', 'product', 'allocated', 'onHand', 'NSW', 'QLD', 'SA', 'VIC', 'WA', 'required', 'suggested', 'toFill', 'transfer', 'notes'];
  public categoryOptions = [
    {value: 'M', name: 'Manufactured'},
    {value: 'A', name: 'Allied'},
    {value: 'H', name: 'Heatherton'},
    {value: 'PM', name: 'Print Codes'},
    {value: 'NA', name: 'Allied NSW'},
    {value: 'QA', name: 'Allied QLD'},
    {value: 'SA', name: 'Allied SA'},
    {value: 'WA', name: 'Allied WA'}
  ];
  public branchVendors = [
    {branch: 'NSW', vendors: ['100241', '300310', '404562', '502014']},
    {branch: 'QLD', vendors: ['100086', '200001']},
    {branch: 'SA', vendors: ['164403', '200387', '300299']},
    //{branch: 'VIC', vendors: ['200113', '300365']},
    {branch: 'WA', vendors: ['164802', '200231', '300298']}
  ];
  
  public get otherVendors(): Array<{branch: string, vendors: string[]}> {
    return this.branchVendors.filter(_ => _.branch !== this.branchFilter.value);
  }

  public get otherStates(): Array<string> {
    const states = this.states.filter(_ => _ !== this.branchFilter.value)
    return [...states, 'allocated', 'required', 'toFill'];
  }

  public get displayedColumns(): Array<string> {
    const toRemove = (this.otherStates.filter(_ => !this.chosenColumns.includes(_)))
    return this.columns.filter(_ => _ !== this.branchFilter.value).filter(_ => !toRemove.includes(_));
  }

  public get lines(): FormArray<FormGroup> {
    return this.transferForm.get('lines') as FormArray;
  }

  public get vendorCodes(): Array<string> {  
    return this.chosenVendors.map(branch => this.branchVendors.find(_ => _.branch === branch)?.vendors || []).reduce((acc, cur) => [...acc, ...cur], []);
  }

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private navService: NavigationService,
    private panListService: PanListService
  ) { }

  ngOnInit(): void {
    if (!this.showNotes) this.columns = this.columns.filter(_ => _ !== 'notes');
    this.saving.next('saved');
    this._scheduleId = this.route.snapshot.paramMap.get('id') || '';
    const state$ = this.shared.getBranch();
    this.transferForm = this.fb.group({
      lines: this.fb.array([]),
    });

    this.transferForm.valueChanges.pipe(
      tap(_ => {
        this.activeLines.emit(_['lines'].filter((l: any) => l.toTransfer > 0));
        this.lineCount.emit(this.getLinesToTransfer(_['lines']));
      })
    ).subscribe();

    this.route.queryParams.pipe(
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
      switchMap(_ => this._loadList ? this.getSuggestedItems(_) : of([] as Array<SuggestedItem>)),
      map(_ => _.map(line => this.makeFormGroup(line, false))),
      tap(_ => {
        this.loading = false;
        _.filter(_ => _.value['qtyRequired'] > 0 || _.value['toFill'] > 0 || _.value['suggested'] > 0).forEach(l => this.lines.push(l))
        this._matTable?.renderRows();
      }),
      map(_ => true)
    ).subscribe();

    this.itemSearch.valueChanges.pipe(
      tap(q => {
        if (!q) return;
        const newItem = this.makeFormGroup(q, true);
        this.lines.insert(0, newItem);
        this._matTable?.renderRows();
        this.itemSearch.reset();
      })
    ).subscribe();
  }

  extraLine(): FormGroup<any> {
    const line = {ItemNmbr: 'UNSET'} as SuggestedItem;
    return this.makeFormGroup(line, true);
  }

  formMapper(_: SuggestedItem): any {
    const toFill = (_[this.max] && _['QtyAvailable'] < _[this.min]) ? _['QtyRequired'] + _[this.max] : null;
    const qtyAllocated = (_.QtyAllocated +  _.QtyBackordered) || null;
    return {
      id: _.Id,
      itemDesc: _.ItemDesc,
      itemNumber: _.ItemNmbr,
      bin: _.Bin?.replace('QLD BIN', ''),
      palletQty: _.PalletQty,
      packSize: _.PackSize == _.PalletQty ? '-' : _.PackSize,
      vendor: _.Vendor,
      category: _.Category,
      vicOnHand: _.OnHandVIC,
      qldOnHand: _.OnHandQLD,
      saOnHand: _.OnHandSA,
      waOnHand: _.OnHandWA,
      nswOnHand: _.OnHandNSW,
      onHand: _.QtyOnHand,
      qtyAllocated,
      underStocked: qtyAllocated && qtyAllocated > _.QtyOnHand,
      qtyRequired: Math.max(0, _.QtyRequired) || null,
      suggested: toFill || Math.max(0, _.QtyRequired) || null,
      toFill: _[this.max] ? _.QtyRequired + _[this.max] : null,
      itemPicker: null
    };
  }

  makeFormGroup(line: SuggestedItem, custom: boolean): FormGroup {
    const origToTransfer =  new FormControl<number | null>(line.ToTransfer || null);
    const toTransfer = new FormControl<number | null>(line.ToTransfer || null);
    const notes = new FormControl<string | null>(line.Notes || null);
    const origNotes = new FormControl<string | null>(line.Notes || null);
    const f = this.formMapper(line);
    const formGroup = this.fb.group({...f, toTransfer, origToTransfer, notes, origNotes, custom});

    formGroup.valueChanges.pipe(
      tap(() => this.saving.next('saving')),
      debounceTime(1000),
      distinctUntilChanged((a_old, a_new) => {
        this.saving.next('saved')
        const unchangedNotes = a_new['notes'] === formGroup.value['origNotes'];
        const unchangedQty = a_new['toTransfer'] === formGroup.value['origToTransfer'];
        return unchangedNotes && unchangedQty;
      }),
      tap(() => this.saving.next('saving')),
      tap(_ => this.updatePanList(formGroup.value['itemNumber'] as string, formGroup.value['itemDesc'] as string, _['toTransfer'] as number, _['notes'] as string).then(() => {
        formGroup.patchValue({origToTransfer: _['toTransfer'], origNotes: _['notes']});
        this.saving.next('saved');
      }).catch(e =>  {
        formGroup.patchValue({toTransfer: formGroup.value['origToTransfer'], notes: formGroup.value['origNotes']});
        this.saving.next('error');
      }))
    ).subscribe();
    return formGroup;
  }

  getSuggestedItems(params: Params): Observable<SuggestedItem[]> {
    const branch = params['branch'] || '';
    if (!branch) return of([]);
    return this.panListService.getPanListWithQuantities(branch, this._scheduleId, this._panId);
  }

  updatePanList(itemNumber: string | null | undefined, itemDescription: string | null | undefined, quantity: number | null | undefined, notes: string | null | undefined): Promise<RequestLine> {
    if (!itemNumber || !this.autosave) return new Promise(_ => _);
    return this.panListService.setRequestedQuantities(quantity, notes, itemNumber, itemDescription, this._scheduleId, this._panId);
  }

  parseParams(params: Params): void {
    if (!params) return;
    this.lines.clear();
    const filters: Params = {};
    if ('pan' in params) {
      this._panId = parseInt(params['pan']);
      filters['pan'] = params['pan'];
    } else {
      this._panId = 0;
    }
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
      filters['branch'] = params['branch'];
    } else {
      this.branchFilter.patchValue(this.states[0]);
    }
    if ('categories' in params) {
      const categories = Array.isArray(params['categories']) ? params['categories'] : [params['categories']];
      this.categories = categories;
    } else {
      this.categories = [...this.defaultCategories];
    }
    if ('columns' in params) {
      const chosenColumns = Array.isArray(params['columns']) ? params['columns'] : [params['columns']];
      this.chosenColumns = chosenColumns;
    } else {
      this.chosenColumns = [...this.defaultColumns];
    }
    if ('vendors' in params) {
      const vendors = Array.isArray(params['vendors']) ? params['vendors'] : [params['vendors']];
      this.chosenVendors = vendors;
    } else {
      this.chosenVendors = [];
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
    const sameCategories = prev['categories'] === curr['categories'];
    const sameColumns = prev['columns'] === curr['columns'];
    return this._loadList && sameBranch;
  }

  openDialog(itemNmbr: string) {
    const dialogRef = this.dialog.open(TransactionHistoryDialogComponent, {
      autoFocus: false,
      width: '800px',
      data: {itemNmbr, branch: this.ownState}
    });
  }

  getTransactions(itemNmbr: string): Promise<string> {
    return this.shared.getTransactions(this.ownState, itemNmbr).then(_ => 'eeytsdyh').catch(_ => '');
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setCategories(categories: MatSelectChange): void {
    this.router.navigate([], { queryParams: {categories: categories.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setVendors(vendors: MatSelectChange): void {
    this.router.navigate([], { queryParams: {vendors: vendors.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setColumns(columns: MatSelectChange): void {
    this.router.navigate([], { queryParams: {columns: columns.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalQtyOnHand(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.qtyOnHand, 0);
  }

  getTotalRequiredQty(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.qtyRequired, 0);
  }

  getTotalRequestedLines(lines: Array<any> | undefined): number {
    if (!lines) return 0;
    const l: Array<any> = lines;
    return l.reduce((acc, cur) => acc + 1, 0);
  }

  getLinesToTransfer(lines: Array<any>): number {
    return lines.filter(_ => _.toTransfer > 0).length;
  }

  getTotalToTransfer(lines: Array<any>): number {
    return lines?.reduce((acc, cur) => acc + cur.value.toTransfer, 0);
  }

  getTotalPalletCount(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + (cur.value.palletQty && cur.value.palletQty !== 5000 ? cur.value.toTransfer / cur.value.palletQty : 0), 0);
  }

  submitForm(): void {
    this.saveClicked.emit(this.transferForm);
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

  goBack(): void {
    this.navService.back();
  }

}
