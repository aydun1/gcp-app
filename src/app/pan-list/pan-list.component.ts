import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { NavigationService } from '../navigation.service';

import { SharedService } from '../shared.service';
import { PanListService } from './pan-list.service';
import { SuggestedItem } from './suggested-item';

@Component({
  selector: 'gcp-pan-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pan-list.component.html',
  styleUrls: ['./pan-list.component.css']
})
export class PanListComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  private scheduleId!: string;
  private panId!: number;

  private _InterstateTransferSubject$ = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private _loadList!: boolean;
  public branchFilter = new FormControl({value: '', disabled: false});
  public viewFilter = new FormControl('');
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public creating = false;
  public suppliers: Array<string> = [];
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
  public saving = new Subject<boolean>();
  public columns = [ 'bin', 'product', 'category', 'NSW', 'QLD', 'SA', 'VIC', 'WA', 'onHand', 'required', 'toFill', 'transfer'];
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

  public get transferQty(): number {
    return this.lines.value.reduce((acc, cur) => acc + cur['toTransfer']
  , 0);
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
      const formGroup = this.fb.group({
        index: [i += 1],
        id: [_.Id],
        itemDesc: [_.ItemDesc],
        itemNumber: [_.ItemNumber],
        bin: [_.Bin?.replace('QLD BIN', '')],
        palletQty: [_.PalletQty],
        packSize: [_.PackSize == _.PalletQty ? '-' : _.PackSize],
        category: [_.Category],
        vicOnHand: [_.OnHandVIC],
        qldOnHand: [_.OnHandQLD],
        saOnHand: [_.OnHandSA],
        waOnHand: [_.OnHandWA],
        nswOnHand: [_.OnHandNSW],
        onHand: [_.QtyOnHand],
        qtyRequired: [Math.max(0, _.QtyRequired) || null],
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
    return this.transferForm;
  }
  
  getSuggestedItems(params: Params): Observable<SuggestedItem[]> {
    const branch = params['branch'] || '';
    if (!branch) return of([]);
    return this.panListService.getPanListWithQuantities(branch, this.scheduleId, this.panId);
  }

  updatePanList(itemNumber: string | null | undefined, itemDescription: string | null | undefined, quantity: number | null | undefined) {
    if (!itemNumber) return;
    this.saving.next(true);
    this.panListService.setRequestedQuantities(quantity, itemNumber, itemDescription, this.scheduleId, this.panId).then(() => {
      this.saving.next(false);
      this.panListService.getRequestedQuantities(this.scheduleId, this.panId)
    });
  }

  parseParams(params: Params): void {
    const defaultCategories = ['M', 'A', 'H', 'PM'];
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
    if ('categories' in params) {
      const categories = Array.isArray(params['categories']) ? params['categories'] : [params['categories']];
      this.categories = categories;
    } else {
      this.categories = [...defaultCategories];
    }
    if ('suppliers' in params) {
      const suppliers = Array.isArray(params['suppliers']) ? params['suppliers'] : [params['categories']];
      this.suppliers = suppliers;
    } else {
      this.suppliers = [];
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

  goBack(): void {
    this.navService.back();
  }

}
