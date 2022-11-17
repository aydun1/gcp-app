import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacySelectChange as MatSelectChange } from '@angular/material/legacy-select';
import { MatLegacySlideToggleChange as MatSlideToggleChange } from '@angular/material/legacy-slide-toggle';
import { MatLegacyTable as MatTable } from '@angular/material/legacy-table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { TransactionHistoryDialogComponent } from '../../interstate-transfers/transaction-history-dialog/transaction-history-dialog.component';
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

  @Input() suggestions = true;
  @Input() autosave!: boolean;
  @Input() defaultCategories: Array<string> = [];
  @Input() defaultColumns: Array<string> = [];
  @Input() showSuppliers: boolean = true;
  @Input() showNotes: boolean = false;
  @Input() estimatePallets: boolean = false;
  @Input() min = 'MinOrderQty';
  @Input() max = 'MaxOrderQty';
  @Input() panNote!: string;
  @Output() saveClicked: EventEmitter<FormGroup> = new EventEmitter();
  @Output() lineCount: EventEmitter<number> = new EventEmitter();
  @Output() activeLines: EventEmitter<any[]> = new EventEmitter();
  @Output() note: EventEmitter<string | null> = new EventEmitter();

  private _scheduleId!: string;
  private _panId!: number;
  private _loadList!: boolean;

  public itemSearch = new FormControl<SuggestedItem | null>(null);
  public notes = new FormControl<string>(this.panNote);
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
  public hideNoStockHea = false;
  public hideNoStockVic = false;
  public hideNoStockNsw = false;
  public hideNoStockQld = false;
  public hideNoStockSa = false;
  public hideNoStockWa = false;
  public hideUnrequireds = false;
  public hideUnsuggesteds = false;
  public hideNoMaxes = false;
  public saving = new Subject<string>();
  public columns = [ 'bin', 'product', 'allocated', 'onHand', 'HEA', 'NSW', 'QLD', 'SA', 'VIC', 'WA', 'required', 'suggested', 'toFill', 'transfer', 'notes'];
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
    this.notes.setValue(this.panNote);
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

    this.notes.valueChanges.pipe(
      debounceTime(500),
      tap(_ => this.note.next(_))
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
      switchMap(_ => this._loadList && this.suggestions ? this.getSuggestedItems(_) : of([] as Array<SuggestedItem>)),
      map(_ => _.map(line => this.makeFormGroup(line, false))),
      tap(_ => {
        this.loading = false;
        this.lines.clear();
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

  calculateSpaces(palQty: number, palHeight: number, toTransfer: number | undefined): number {
    return palQty && palQty !== 500 ? ((toTransfer || 0) / palQty * (Math.trunc(palHeight / 1000) / 2)) : 0;
  }

  formMapper(_: SuggestedItem): any {
    const qtyAllocated = _.QtyAllocated +  _.QtyBackordered;
    const qtyOnHand = _.QtyOnHand + _.InTransit + _.PreTransit;
    const required = Math.max(0, _.QtyAvailable * -1);
    const toFill = _[this.max] ? _.QtyAvailable * -1 + _[this.max] : required;
    const suggested =  _.QtyAvailable < _[this.min] ? toFill : 0;
    return {
      id: _.Id,
      itemDesc: _.ItemDesc,
      itemNumber: _.ItemNmbr,
      bin: _.Bin?.replace('QLD BIN', ''),
      palletQty: _.PalletQty,
      palletHeight: _.PalletHeight,
      packSize: _.PackSize === _.PalletQty ? '-' : _.PackSize,
      vendor: _.Vendor,
      category: _.Category,
      vicOnHand: _.OnHandVIC,
      heaOnHand: _.OnHandHEA,
      qldOnHand: _.OnHandQLD,
      saOnHand: _.OnHandSA,
      waOnHand: _.OnHandWA,
      nswOnHand: _.OnHandNSW,
      qtyOnHand,
      qtyAllocated: qtyAllocated || null,
      underStocked: qtyAllocated && qtyAllocated > qtyOnHand,
      qtyRequired: required || null,
      suggested: suggested || null,
      toFill: toFill,
      toFill2: toFill
    };
  }

  makeFormGroup(line: SuggestedItem, custom: boolean): FormGroup {
    const origToTransfer =  new FormControl<number | null>(line.ToTransfer || null);
    const toTransfer = new FormControl<number | null>(line.ToTransfer || null);
    const notes = new FormControl<string | null>(line.Notes || null);
    const origNotes = new FormControl<string | null>(line.Notes || null);
    const f = this.formMapper(line);
    const spaces = this.calculateSpaces(line.PalletQty, line.PalletHeight, line.ToTransfer);
    const formGroup = this.fb.group({...f, toTransfer, origToTransfer, notes, origNotes, custom, spaces});

    formGroup.valueChanges.pipe(
      tap(() => this.saving.next('saving')),
      debounceTime(500),
      distinctUntilChanged((a_old, a_new) => {
        this.saving.next('saved');
        const unchangedNotes = a_new['notes'] === a_old['notes'];
        const unchangedQty = a_new['toTransfer'] === a_old['toTransfer'];
        return unchangedNotes && unchangedQty;
      }),
      tap(_ => {
        this.saving.next('saving');
        const spaces = this.calculateSpaces(_['palletQty'] as number, _['palletHeight'] as number, _['toTransfer'] as number);
        formGroup.patchValue({spaces});
      }),
      switchMap(_ => this.updatePanList(_)),
      tap(_ => {
        formGroup.patchValue({origToTransfer: _.fields['Quantity'], origNotes: _.fields['Notes']});
        this.saving.next('saved');
      }),
      catchError(e => {
        formGroup.patchValue({toTransfer: formGroup.value['origToTransfer'], notes: formGroup.value['origNotes']});
        this.saving.next('error');
        return of();
      })
    ).subscribe();
    return formGroup;
  }

  getSuggestedItems(params: Params): Observable<SuggestedItem[]> {
    const branch = params['branch'] || '';
    if (!branch) return of([]);
    return this.panListService.getPanListWithQuantities(branch, this._scheduleId, this._panId);
  }

  updatePanList(formGroup: any): Observable<RequestLine> {
    const itemNumber = formGroup['itemNumber'] as string;
    const itemDescription = formGroup['itemDesc'] as string
    const quantity = formGroup['toTransfer'] as number;
    const notes = formGroup['notes'] as string;
    if (!itemNumber || !this.autosave) return of();
    return this.panListService.setRequestedQuantities(quantity, notes, itemNumber, itemDescription, this._scheduleId, this._panId);
  }

  parseParams(params: Params): void {
    if (!params) return;
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
    if ('hea' in params) this.hideNoStockHea = params['hea'] === 'true';
    if ('nsw' in params) this.hideNoStockNsw = params['nsw'] === 'true';
    if ('qld' in params) this.hideNoStockQld = params['qld'] === 'true';
    if ('sa' in params) this.hideNoStockSa = params['sa'] === 'true';
    if ('vic' in params) this.hideNoStockVic = params['vic'] === 'true';
    if ('wa' in params) this.hideNoStockWa = params['wa'] === 'true';
    if ('suggested' in params) this.hideUnsuggesteds = params['suggested'] === 'true';
    if ('required' in params) this.hideUnrequireds = params['required'] === 'true';
    if ('tofill' in params) this.hideNoMaxes = params['tofill'] === 'true';    
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameBranch = prev['branch'] === curr['branch'];
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

  toggle(label: string, a: MatSlideToggleChange): void {
    this.router.navigate([], { queryParams: {[label]: a.checked || null}, queryParamsHandling: 'merge', replaceUrl: true});
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
    return lines.reduce((acc, cur) => acc + cur.value.spaces, 0);
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
