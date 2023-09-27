import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTable } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

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
  @Input() includeUnsent = false;
  @Input() autosave!: boolean;
  @Input() defaultCategories: Array<string> = [];
  @Input() defaultColumns: Array<string> = [];
  @Input() showSuppliers: boolean = true;
  @Input() showNotes: boolean = false;
  @Input() estimatePallets: boolean = false;
  @Input() min: 'MinOrderQty' | 'OrderPointQty' = 'MinOrderQty';
  @Input() max: 'MaxOrderQty' | 'OrderUpToLvl' = 'MaxOrderQty';
  @Input() panNote!: string;
  @Output() saveClicked: EventEmitter<FormGroup> = new EventEmitter();
  @Output() lineCount: EventEmitter<number> = new EventEmitter();
  @Output() activeLines: EventEmitter<SuggestedItem[]> = new EventEmitter();
  @Output() note: EventEmitter<string | null> = new EventEmitter();

  private _scheduleId!: string;
  private _panId!: number;
  private _loadList!: boolean;

  public itemSearch = new FormControl<SuggestedItem | null>(null);
  public notes = new FormControl<string>(this.panNote);
  public branchFilter = new FormControl({value: '', disabled: true});
  public viewFilter = new FormControl('');
  public loading = new BehaviorSubject<boolean>(true);
  public sortField = new BehaviorSubject<string>('ItemNmbr');
  public creating = false;
  public chosenColumns: Array<string> = [];
  public chosenVendors: Array<string> = [];
  public categories: Array<string> = [];
  public totals!: object;
  public states = this.shared.branches;
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
  public columns = [ 'product', 'allocated', 'onHand', 'HEA', 'NSW', 'QLD', 'SA', 'VIC', 'WA', 'required', 'suggested', 'toFill', 'spacer', 'transfer', 'notes'];
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
    const states = this.states.filter(_ => _ !== this.branchFilter.value);
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
    this.initForm([]);
    this.notes.valueChanges.pipe(
      debounceTime(500),
      tap(_ => this.note.next(_))
    ).subscribe();

    this.route.queryParams.pipe(
      startWith({} as {branch: string}),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(map(state => !params['branch'] ? {...params, branch: state} : params))),
      tap(_ => this.parseParams(_)),
      tap(_ => this.loading.next(true)),
      switchMap(_ => this._loadList && this.suggestions ? this.getSuggestedItems(_) : of([] as Array<SuggestedItem>)),
      map(_ => _.map(line => this.makeFormGroup(line, false))),
      switchMap(_ => this.sortField.pipe(tap(sorter => {
        this.loading.next(false);
        //this.lines.clear();
        const items = _.filter(_ => _.value['QtyRequired'] > 0 || _.value['ToFill'] > 0 || _.value['Suggested'] > 0 || _.value['ToTransfer'] > 0);
        this.initForm(items.sort((a, b) => (b.get('ToTransfer')?.value > 0) || (a.get(sorter)?.value || 0) < (b.get(sorter)?.value || 0) ? 1 : -1));
        //this._matTable?.renderRows();
      }))),
      map(_ => true)
    ).subscribe();

    this.itemSearch.valueChanges.pipe(
      tap(q => {
        if (!q) return;
        const index = this.lines.value.findIndex(_ => _.ItemNmbr === q.ItemNmbr);
        if (index > -1) {
          q.ToTransfer = this.lines.value[index]['ToTransfer'];
          q.Notes = this.lines.value[index]['Notes'];
          this.lines.removeAt(index);
        }
        const newItem = this.makeFormGroup(q, true);
        this.lines.insert(0, newItem);
        this._matTable?.renderRows();
        this.itemSearch.reset();
      })
    ).subscribe();
  }

  initForm(items: FormGroup<any>[]): void {
    this.transferForm = this.fb.group({
      lines: this.fb.array(items)
    });
    this.transferForm.valueChanges.pipe(
      tap(_ => {
        this.activeLines.emit(_['lines'].filter((l: SuggestedItem) => l.ToTransfer > 0));
        this.lineCount.emit(this.getLinesToTransfer(_['lines']));
      })
    ).subscribe();
  }

  sort() {
    this.transferForm.get('lines')?.setValue(this.lines.value);
  }

  sortForm(selected: MatSelectChange): void {
    this.router.navigate([], { queryParams: {sort: selected.value}, queryParamsHandling: 'merge', replaceUrl: true});
    this.sortField.next(selected.value);
  }

  calculateSpaces(palQty: number, palHeight: number, toTransfer: number | undefined): number {
    return palQty && palQty !== 1 && palQty !== 500 ? ((toTransfer || 0) / palQty * (Math.trunc(palHeight / 1000) / 2)) : 0;
  }

  formMapper(_: SuggestedItem): SuggestedItem {
    const qtyAllocated = this.includeUnsent ? _.QtyAllocated + _.QtyBackordered : _.QtyAllocated;
    const qtyOnHand = this.includeUnsent ? _.QtyOnHand + _.InTransit + _.PreTransit : _.QtyOnHand;
    const required = Math.max(0, _.QtyAvailable * -1);
    const toFill = _[this.max] ? _.QtyAvailable * -1 + _[this.max] : required;
    const suggested =  _.QtyAvailable < _[this.min] ? toFill : 0;
    return {
      Id: _.Id,
      ItemDesc: _.ItemDesc,
      ItemNmbr: _.ItemNmbr,
      Bin: _.Bin?.replace('QLD BIN', ''),
      PalletQty: _.PalletQty,
      PalletHeight: _.PalletHeight,
      PackSize: _.PackSize === _.PalletQty ? '-' : _.PackSize,
      Vendor: _.Vendor,
      Category: _.Category,
      OnHandVIC: _.OnHandVIC,
      OnHandHEA: _.OnHandHEA,
      OnHandQLD: _.OnHandQLD,
      OnHandSA: _.OnHandSA,
      OnHandWA: _.OnHandWA,
      OnHandNSW: _.OnHandNSW,
      AllocHEA: _.AllocHEA,
      AllocNSW: _.AllocNSW,
      AllocQLD: _.AllocQLD,
      AllocSA: _.AllocSA,
      AllocVIC: _.AllocVIC,
      AllocWA: _.AllocWA,
      AvailHEA: _.OnHandHEA - _.AllocHEA,
      AvailNSW: _.OnHandNSW - _.AllocNSW,
      AvailQLD: _.OnHandQLD - _.AllocQLD,
      AvailSA: _.OnHandSA - _.AllocSA,
      AvailVIC: _.OnHandVIC - _.AllocVIC,
      AvailWA: _.OnHandWA - _.AllocWA,
      MinOrderQty: _.MinOrderQty,
      MaxOrderQty: _.MaxOrderQty,
      OrderPointQty: _.OrderPointQty,
      OrderUpToLvl: _.OrderUpToLvl,
      QtyOnHand: qtyOnHand,
      QtyAllocated: qtyAllocated,
      QtyBackordered: _.QtyBackordered,
      UnderStocked: _.QtyAllocated && _.QtyAllocated > qtyOnHand ? true : false,
      QtyRequired: required || null,
      Suggested: suggested || null,
      ToFill: toFill,
      ToFill2: toFill
    } as SuggestedItem;
  }

  makeFormGroup(line: SuggestedItem, custom: boolean): FormGroup {
    const origToTransfer =  new FormControl<number | null>(line.ToTransfer || null);
    const toTransfer = new FormControl<number | null>(line.ToTransfer || null);
    const notes = new FormControl<string | null>(line.Notes || null);
    const origNotes = new FormControl<string | null>(line.Notes || null);
    const f = this.formMapper(line);
    const spaces = this.calculateSpaces(line.PalletQty, line.PalletHeight, line.ToTransfer);
    const formGroup = this.fb.group({
      ...f,
      ToTransfer: toTransfer,
      origToTransfer,
      Notes: notes,
      origNotes,
      Custom: custom,
      Spaces: spaces
    });

    formGroup.valueChanges.pipe(
      tap(() => this.saving.next('saving')),
      debounceTime(500),
      distinctUntilChanged((a_old, a_new) => {
        this.saving.next('saved');
        const unchangedNotes = a_new['Notes'] === a_old['Notes'];
        const unchangedQty = a_new['ToTransfer'] === a_old['ToTransfer'];
        return unchangedNotes && unchangedQty;
      }),
      tap(_ => {
        this.saving.next('saving');
        const spaces = this.calculateSpaces(_['PalletQty'] as number, _['PalletHeight'] as number, _['ToTransfer'] as number);
        formGroup.patchValue({Spaces: spaces});
      }),
      switchMap(_ => this.updatePanList(_)),
      tap(_ => {
        formGroup.patchValue({origToTransfer: _.fields['Quantity'], origNotes: _.fields['Notes']});
        this.saving.next('saved');
      }),
      catchError(e => {
        formGroup.patchValue({ToTransfer: formGroup.value['origToTransfer'], Notes: formGroup.value['origNotes']});
        this.saving.next('error');
        return of();
      })
    ).subscribe();
    return formGroup;
  }

  getSuggestedItems(params: Params): Observable<SuggestedItem[]> {
    const branch = params['branch'] || '';
    if (!branch) return of([]);
    return this.panListService.getPanListWithQuantities(branch, this._scheduleId, this._panId).pipe();
  }

  updatePanList(formGroup: any): Observable<RequestLine> {
    const itemNumber = formGroup['ItemNmbr'] as string;
    const itemDescription = formGroup['ItemDesc'] as string
    const quantity = formGroup['ToTransfer'] as number;
    const notes = formGroup['Notes'] as string;
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
    if ('Suggested' in params) this.hideUnsuggesteds = params['Suggested'] === 'true';
    if ('Required' in params) this.hideUnrequireds = params['Required'] === 'true';
    if ('Tofill' in params) this.hideNoMaxes = params['Tofill'] === 'true';    
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

  openDialog(item: SuggestedItem): void {
    this.dialog.open(TransactionHistoryDialogComponent, {
      autoFocus: false,
      width: '800px',
      data: {itemNmbr: item.ItemNmbr, branch: this.branchFilter.value, item: item}
    });
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

  getTotalQtyOnHand(lines: Array<SuggestedItem>): number {
    return lines.reduce((acc, cur) => acc + cur.QtyOnHand, 0);
  }

  getTotalRequiredQty(lines: Array<SuggestedItem>): number {
    return lines.reduce((acc, cur) => acc + (cur.QtyRequired || 0), 0);
  }

  getTotalRequestedLines(lines: FormGroup<any>[]): number {
    if (!lines) return 0;
    const l: Array<any> = lines;
    return l.reduce((acc, cur) => acc + 1, 0);
  }

  getLinesToTransfer(lines: Array<SuggestedItem>): number {
    return lines.filter(_ => _.ToTransfer > 0).length;
  }

  getTotalToTransfer(lines: Array<{value: SuggestedItem}>): number {
    return lines?.reduce((acc, cur) => acc + cur.value.ToTransfer, 0);
  }

  getTotalPalletCount(lines: Array<{value: SuggestedItem}>): number {
    return lines.reduce((acc, cur) => acc + cur.value.Spaces, 0);
  }

  submitForm(): void {
    this.saveClicked.emit(this.transferForm);
  }

  trackByFn(index: number, item: FormGroup<any>): number {
    return item.get('Id')?.value;
  }

  goBack(): void {
    this.navService.back();
  }

}
