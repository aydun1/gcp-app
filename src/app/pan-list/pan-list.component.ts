import { ChangeDetectionStrategy, Component, HostBinding, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { NavigationService } from '../navigation.service';
import { SharedService } from '../shared.service';
import { PanListService } from './pan-list.service';
import { RequestLine } from './request-line';
import { SuggestedItem } from './suggested-item';

@Component({
  selector: 'gcp-pan-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pan-list.component.html',
  styleUrls: ['./pan-list.component.css']
})
export class PanListComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  private _scheduleId!: string;
  private _panId!: number;
  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;

  public branchFilter = new FormControl({value: '', disabled: false});
  public viewFilter = new FormControl('');
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public creating = false;
  public suppliers: Array<string> = [];
  public categories: Array<string> = [];
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

  public saving = new Subject<string>();
  public columns = [ 'bin', 'product', 'NSW', 'QLD', 'SA', 'VIC', 'WA', 'onHand', 'required', 'suggested', 'toFill', 'transfer'];
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
    {branch: 'VIC', vendors: ['200113', '300365']},
    {branch: 'WA', vendors: ['164802', '200231', '300298']}
  ];
  
  public get otherStates(): Array<string> {
    return this.states.filter(_ => _ !== this.branchFilter.value)
  }

  public get displayedColumns(): Array<string> {
    const toRemove = (this.states.filter(_ => !this.suppliers.includes(_)))
    return this.columns.filter(_ => _ !== this.branchFilter.value).filter(_ => !toRemove.includes(_));
  }

  public get lines(): FormArray<FormGroup> {
    return this.transferForm.get('lines') as FormArray;
  }

  public get vendorCodes(): Array<string> {  
    return this.chosenVendors.map(branch => this.branchVendors.find(_ => _.branch === branch)?.vendors || []).reduce((acc, cur) => [...acc, ...cur], []);
  }

  public get transferQty(): number {
    return this.lines.value.reduce((acc, cur) => acc + cur['toTransfer'], 0);
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
    this.saving.next('saved')
    this._scheduleId = this.route.snapshot.paramMap.get('id') || '';
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
        category: [_.Category],
        vicOnHand: [_.OnHandVIC],
        qldOnHand: [_.OnHandQLD],
        saOnHand: [_.OnHandSA],
        waOnHand: [_.OnHandWA],
        nswOnHand: [_.OnHandNSW],
        onHand: [_.QtyOnHand],
        qtyRequired: [Math.max(0, _.QtyRequired) || null],
        suggested: [toFill || Math.max(0, _.QtyRequired) || null],
        toFill: [_.Max ? _.QtyRequired + _.Max : null],
        origToTransfer: [_.ToTransfer],
        toTransfer: [_.ToTransfer]
      });
      formGroup.controls['toTransfer'].valueChanges.pipe(
        tap(() => this.saving.next('saving')),
        debounceTime(1000),
        distinctUntilChanged((b, a) => {
          this.saving.next('saved')
          const unchanged = a === formGroup.value['origToTransfer'];
          return unchanged;
        }),
        tap(() => this.saving.next('saving')),
        tap(_ => this.updatePanList(formGroup.value['itemNumber'] as string, formGroup.value['itemDesc'], _).then(() => {
          formGroup.patchValue({origToTransfer: _});
          this.saving.next('saved');
        }).catch(e =>  {
          formGroup.patchValue({toTransfer: formGroup.value['origToTransfer']});
          this.saving.next('error');
        }))
      ).subscribe();
      this.lines.push(formGroup);
    });
    this.loading = false;
    return this.transferForm;
  }
  
  getSuggestedItems(params: Params): Observable<SuggestedItem[]> {
    const branch = params['branch'] || '';
    if (!branch) return of([]);
    return this.panListService.getPanListWithQuantities(branch, this._scheduleId, this._panId).pipe(
      tap(_ => this.loading = false)
    );
  }

  updatePanList(itemNumber: string, itemDescription: string | null | undefined, quantity: number | null | undefined): Promise<RequestLine> {
    return this.panListService.setRequestedQuantities(quantity, itemNumber, itemDescription, this._scheduleId, this._panId);
  }

  parseParams(params: Params): void {
    const defaultCategories = ['M', 'A', 'H', 'PM'];
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
      this.categories = [...defaultCategories];
    }
    if ('suppliers' in params) {
      const suppliers = Array.isArray(params['suppliers']) ? params['suppliers'] : [params['suppliers']];
      this.suppliers = suppliers;
    } else {
      this.suppliers = ['VIC'];
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
    const sameSuppliers = prev['suppliers'] === curr['suppliers'];
    return this._loadList && sameBranch;
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

  getTotalPalletCount(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + (cur.palletQty && cur.palletQty !== 5000 ? cur.toTransfer / cur.palletQty : 0), 0);

  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

  goBack(): void {
    this.navService.back();
  }

}