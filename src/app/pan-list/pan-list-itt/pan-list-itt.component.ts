import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { NavigationService } from '../../navigation.service';

import { SharedService } from '../../shared.service';
import { PanListService } from '../pan-list.service';
import { SuggestedItem } from '../suggested-item';

@Component({
  selector: 'gcp-pan-list-itt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pan-list-itt.component.html',
  styleUrls: ['./pan-list-itt.component.css']
})
export class PanListITTComponent implements OnInit {

  @Input() autosave!: boolean;
  @Output() saveClicked: EventEmitter<FormGroup> = new EventEmitter();
  @Output() lineCount: EventEmitter<number> = new EventEmitter();
  @Output() activeLines: EventEmitter<any[]> = new EventEmitter();

  private scheduleId!: string;
  private panId!: number;

  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public branchFilter = new FormControl({value: '', disabled: true});
  public viewFilter = new FormControl('');
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public creating = false;
  public chosenColumns: Array<string> = [];
  public chosenVendors: Array<string> = []
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

  public saving = new Subject<boolean>();
  public columns = [ 'bin', 'product', 'NSW', 'QLD', 'SA', 'VIC', 'WA', 'onHand', 'required', 'suggested', 'toFill', 'transfer'];

  public branchVendors = [
    {branch: 'NSW', vendors: ['100241', '300310', '404562', '502014']},
    {branch: 'QLD', vendors: ['100086', '200001']},
    {branch: 'SA', vendors: ['164403', '200387', '300299']},
    {branch: 'WA', vendors: ['164802', '200231', '300298']}
  ];
  
  public get otherVendors(): Array<{branch: string, vendors: string[]}> {
    return this.branchVendors.filter(_ => _.branch !== this.branchFilter.value);
  }

  public get otherStates(): Array<string> {
    const states = this.states.filter(_ => _ !== this.branchFilter.value)
    return [...states, 'required', 'toFill'];
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
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private navService: NavigationService,
    private panListService: PanListService
  ) { }

  ngOnInit(): void {
    this.scheduleId = this.route.snapshot.paramMap.get('id') || '';
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
      switchMap(_ => this._loadList ? this.getSuggestedItems(_) : []),
      tap(_ => this._InterstateTransferSubject$.next(this.makeFormGroup(_))),
      switchMap(_ => this._InterstateTransferSubject$),
    )
  }

  makeFormGroup(lines: Array<SuggestedItem>): FormGroup<any> {
    this.lines.clear();
    let i = -1;
    lines.forEach(_ => {
      const toFill = (_.Max && _.QtyAvailable < _.Min) ? _.QtyRequired + _.Max : null;
      const toFill2 = _.Max ? _.QtyRequired + _.Max : null;
      const formGroup = this.fb.group({
        index: [i += 1],
        id: [_.Id],
        itemDesc: [_.ItemDesc],
        itemNumber: [_.ItemNumber],
        bin: [_.Bin?.replace('QLD BIN', '')],
        palletQty: [_.PalletQty],
        packSize: [_.PackSize == _.PalletQty ? '-' : _.PackSize],
        vendor: [_.Vendor],
        vicOnHand: [_.OnHandVIC],
        qldOnHand: [_.OnHandQLD],
        saOnHand: [_.OnHandSA],
        waOnHand: [_.OnHandWA],
        nswOnHand: [_.OnHandNSW],
        onHand: [_.QtyOnHand],
        qtyRequired: [Math.max(0, _.QtyRequired) || null],
        suggested: [toFill || Math.max(0, _.QtyRequired) || null],
        toFill: [_.Max ? _.QtyRequired + _.Max : null],
        toTransfer: [_.ToTransfer]
      });
      formGroup.valueChanges.pipe(
        debounceTime(1000),
        tap(_ => this.updatePanList(_.itemNumber, _.itemDesc, _.toTransfer))
      ).subscribe();
      this.lines.push(formGroup);
    });
    this.loading = false;


    this.transferForm.valueChanges.pipe(
      tap(_ => {
        this.activeLines.emit(_['lines'].filter((l: any) => l.toTransfer > 0));
        this.lineCount.emit(this.getLinesToTransfer(_['lines']));
      })
    ).subscribe();



    return this.transferForm;
  }
  
  getSuggestedItems(params: Params): Observable<SuggestedItem[]> {
    const branch = params['branch'] || '';
    if (!branch) return of([]);
    return this.panListService.getPanListWithQuantities(branch, this.scheduleId, this.panId);
  }

  updatePanList(itemNumber: string | null | undefined, itemDescription: string | null | undefined, quantity: number | null | undefined) {
    if (!itemNumber || !this.autosave) return;
    this.saving.next(true);
    this.panListService.setRequestedQuantities(quantity, itemNumber, itemDescription, this.scheduleId, this.panId).then(() => {
      this.saving.next(false);
      this.panListService.getRequestedQuantities(this.scheduleId, this.panId)
    });
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
    if ('pan' in params) {
      this.panId = parseInt(params['pan']);
      filters['pan'] = params['pan'];
    } else {
      this.panId = 0;
    }
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
      filters['branch'] = params['branch'];
    } else {
      this.branchFilter.patchValue(this.states[0]);
    }
    if ('columns' in params) {
      const chosenColumns = Array.isArray(params['columns']) ? params['columns'] : [params['columns']];
      this.chosenColumns = chosenColumns;
    } else {
      this.chosenColumns = [];
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
    const sameColumns = prev['columns'] === curr['columns'];
    return this._loadList && sameBranch && sameColumns;
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setVendors(vendors: MatSelectChange): void {
    this.router.navigate([], { queryParams: {vendors: vendors.value}, queryParamsHandling: 'merge', replaceUrl: true});
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
    const l: Array<any> = this.transferForm.value['lines'];
    return l.reduce((acc, cur) => acc + 1, 0);
  }

  getLinesToTransfer(lines: Array<any>): number {
    return lines.filter(_ => _.toTransfer > 0).length;
  }

  getTotalToTransfer(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.toTransfer, 0);
  }

  submitForm() {
    this.saveClicked.emit(this.transferForm);
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

  goBack(): void {
    this.navService.back();
  }

}
