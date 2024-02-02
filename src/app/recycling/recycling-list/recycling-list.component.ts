import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Choice } from '../../shared/choice';
import { Cage } from '../shared/cage';
import { RecyclingService } from '../shared/recycling.service';
import { BranchTotal } from '../shared/branch-total';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { ActionButtonComponent } from '../shared/action-button/action-button.component';
import { LoadingRowComponent } from '../../shared/loading/loading-row/loading-row.component';

interface monthYear {year: number, month: number, monthName: string, key: string}

@Component({
  selector: 'gcp-recycling-list',
  templateUrl: './recycling-list.component.html',
  styleUrls: ['./recycling-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatInputModule, MatSelectModule, MatSortModule, MatTableModule, ActionButtonComponent, LetterheadComponent, LoadingRowComponent]
})
export class RecyclingListComponent implements OnInit {
  private _loadList!: boolean;
  private lastClicked: number | undefined;
  private shiftHolding = false;
  private branch$ = new BehaviorSubject<string>('');
  private years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  private months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private year = new Date().getFullYear();
  private month = new Date().getMonth();
  public monthDates = this.years.map(_ => {return {year: _, months: this.months.reverse()}}).reduce((a, b) => {
    return a.concat(b.months.map((m, i) => {return {year: b.year, month: 11 - i, monthName: m, key: `${b.year}-${11 - i}`}}))
  }, [] as Array<monthYear>).filter(_ => !(_.year === this.year && _.month > this.month));
  public branchQuantities!: Observable<BranchTotal[]> | null;
  public cages$!: Observable<Cage[]>;
  public cageFilter = new FormControl<number | null>(null);
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public monthFilter = new FormControl('');
  public assetTypeFilter = new FormControl('');
  public materialFilter = new FormControl<number | undefined>(undefined);
  public loading = this.recyclingService.loading;
  public weight!: number;
  public count!: number;
  public displayedColumns: Array<string> = [];
  public sortSort!: string;
  public sortOrder!: 'asc' | 'desc';
  public choices$: Observable<{Status: Choice, AssetType: Choice, Branch: Choice, Material: Choice}> | undefined;
  public materials = this.recyclingService.materials;
  public statusPicked!: boolean;
  public selection = new SelectionModel<Cage>(true, []);
  public date = new Date();

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private recyclingService: RecyclingService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  @HostListener('document:keydown.shift', ['$event'])
  shiftDown(event: KeyboardEvent): void {
    this.shiftHolding = true;
  }
  @HostListener('document:keyup.shift', ['$event'])
  shiftUp(event: KeyboardEvent): void {
    this.shiftHolding = false;
  }

  ngOnInit(): void {
    const state$ = this.sharedService.getBranch();
    this.getOptions();
    this.cages$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap((_: Params) => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(
        map(branch => params['branch'] === undefined ? {...params, branch} : params)
      )),
      tap((_: Params) => {
        this.branch$.next(_['branch']);
        this.parseParams(_);
        this.weight = 0;
        this.count = 0;
        this.selection.clear();
      }),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap((cages: Array<Cage>) => {
        this.updatedSelection(cages);
        this.weight = cages.map(_ => _.fields?.NetWeight?.replace(/,/g, '')).filter(_ => _).reduce((acc, val) => acc + +val, 0);
        this.count = cages.map(() => 1).reduce((acc, val) => acc + val, 0);
      })
    )

    this.branch$.pipe(
      distinctUntilChanged(),
    ).subscribe(_ => this.getBranchQuantities(_))

    this.cageFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _ && _ > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'bin': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  getOptions(): void {
    this.choices$ = this.recyclingService.getColumns().pipe(
      tap(_ => {
        if (!_) return;
        _['Status']['choice']['choices'] = _['Status']['choice']['choices'].filter((c: string) => c !== 'Complete');
        this.hideStatus(_.Status.choice.choices.includes(this.statusFilter.value || ''));
      })
    );
  }

  getFirstPage(_: Params): BehaviorSubject<Cage[]> {
    return this.recyclingService.getFirstPage(_);
  }

  getNextPage(): void {
    this.recyclingService.getNextPage();
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
    } else {
      this.branchFilter.patchValue('');
    }
    if ('status' in params) {
      this.statusFilter.patchValue(params['status']);
    } else {
      this.statusFilter.patchValue('');
    }
    if ('month' in params) {
      this.monthFilter.patchValue(params['month']);
    } else {
      this.monthFilter.patchValue('');
    }
    if ('assetType' in params) {
      this.assetTypeFilter.patchValue(params['assetType']);
    } else {
      this.assetTypeFilter.patchValue('');
    }
    if ('material' in params) {
      const material = parseInt(params['material'])
      this.materialFilter.patchValue(material);
    } else {
      this.materialFilter.patchValue(undefined);
    }
    if ('sort' in params) {
      this.sortSort = params['sort'];
      this.sortOrder = params['order'];
    }
    if ('bin' in params) {
      this.cageFilter.patchValue(params['bin']);
    } else {
      if (this.cageFilter.value) this.cageFilter.patchValue(null);
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const unchanged = [
      this._loadList,
      prev['branch'] === curr['branch'],
      prev['bin'] === curr['bin'],
      prev['assetType'] === curr['assetType'],
      prev['month'] === curr['month'],
      prev['material'] === curr['material'],
      prev['status'] === curr['status'],
      prev['sort'] === curr['sort'],
      prev['order'] === curr['order']
    ]
    return unchanged.every(Boolean);
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setStatus(status: MatSelectChange, choices: Array<string>): void {
    this.hideStatus(choices.includes(status.value));
    this.router.navigate([], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setMonth(month: MatSelectChange): void {
    this.router.navigate([], { queryParams: {month: month.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setAssetType(assetType: MatSelectChange): void {
    this.router.navigate([], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setMaterial(material: MatSelectChange): void {
    this.router.navigate([], { queryParams: {material: material.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearCageFilter(): void {
    this.cageFilter.patchValue(null);
  }

  updatedSelection(cages: Array<Cage>): void {
    this.selection.selected.forEach(
      selected => {
        const match = cages.find(_ => _.id === selected.id);
        this.selection.deselect(selected);
        match ? this.selection.select(match) : this.selection.deselect(selected);
      }
    );
  }

  toggleSelection(index: number, cages: Array<Cage>, e: any): void {
    if (this.shiftHolding && this.lastClicked !== undefined) {
      const start = Math.min(index, this.lastClicked);
      const end = Math.max(index, this.lastClicked) + 1;
      cages.slice(start, end).forEach(_ => e.checked ? this.selection.select(_) : this.selection.deselect(_));
    } else {
      this.selection.toggle(cages[index]);
    }
    this.lastClicked = index;
  }

  announceSortChange(e: Sort): void {
    const sort = e.direction ? e.active : null;
    const order = e.direction || null;
    this.router.navigate([], { queryParams: {sort, order}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  hideStatus(hide: boolean): void {
    const displayedColumns = ['checked', 'fields/CageNumber', 'assetType', 'status', 'location', 'material', 'fields/Modified', 'weight'];
    this.displayedColumns = hide ? displayedColumns.filter(_ => _ !== 'status') : displayedColumns;
  }

  getBranchQuantities(branch: string): void {
    this.branchQuantities = branch ? this.recyclingService.getBranchQuantity(branch, null) : null;
  }

  trackByFn(index: number, item: Cage): string {
    return item.id;
  }
}
