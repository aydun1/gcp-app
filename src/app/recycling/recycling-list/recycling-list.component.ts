import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { Cage } from '../shared/cage';
import { RecyclingService } from '../shared/recycling.service';

interface choice {choice: {choices: Array<any>}, name: string};

@Component({
  selector: 'gcp-recycling-list',
  templateUrl: './recycling-list.component.html',
  styleUrls: ['./recycling-list.component.css']
})
export class RecyclingListComponent implements OnInit {
  private _loadList!: boolean;
  public cages$!: Observable<Cage[]>;
  public binFilter = new FormControl<number | null>(null);
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public assetTypeFilter = new FormControl('');
  public loading = this.recyclingService.loading;
  public weight!: number;
  public count!: number;
  public displayedColumns: Array<string> = [];
  public sortSort!: string;
  public sortOrder!: 'asc' | 'desc';
  public choices$: Observable<{Status: choice, AssetType: choice, Branch: choice}> | undefined;
  public statusPicked!: boolean;
  public placeholder = {AssetType: {choice: {choices: []}, name: ''}, Status: {choice: {choices: []}, name: ''}, Branch: {choice: {choices: []}, name: ''}}

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private recyclingService: RecyclingService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    this.getOptions();
    this.cages$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap((_: Params) => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap((_: Params) => {
        this.parseParams(_);
        this.weight = 0;
        this.count = 0;
      }),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap((cages: Array<Cage>) => {
        this.weight = cages.map(_ => _.fields?.NetWeight).filter(_ => _).reduce((acc, val) => acc + +val, 0);
        this.count = cages.map(() => 1).reduce((acc, val) => acc + val, 0);
      })
    )

    this.binFilter.valueChanges.pipe(
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
        this.hideStatus(_.Status.choice.choices.includes(this.statusFilter.value));
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
    const filters = {};
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
      filters['branch'] = params['branch'];
    } else {
      this.branchFilter.patchValue('');
    }
    if ('status' in params) {
      this.statusFilter.patchValue(params['status']);
      filters['status'] = params['status'];
    } else {
      this.statusFilter.patchValue('');
    }
    if ('assetType' in params) {
      this.assetTypeFilter.patchValue(params['assetType']);
      filters['assetType'] = params['assetType'];
    } else {
      this.assetTypeFilter.patchValue('');
    }
    if ('sort' in params) {
      this.sortSort = params['sort'];
      this.sortOrder = params['order'];
    }
    if ('bin' in params) {
      this.binFilter.patchValue(params['bin']);
      filters['bin'] = params['bin'];
    } else {
      if (this.binFilter.value) this.binFilter.patchValue(null);
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

  setAssetType(assetType: MatSelectChange): void {
    this.router.navigate([], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearBinFilter(): void {
    this.binFilter.patchValue(null);
  }

  announceSortChange(e: Sort): void {
    const sort = e.direction ? e.active : null;
    const order = e.direction || null;
    this.router.navigate([], { queryParams: {sort, order}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  hideStatus(hide: boolean) {
    const displayedColumns = ['fields/CageNumber', 'assetType', 'status', 'location', 'fields/Modified', 'weight', 'check'];
    this.displayedColumns = hide ? displayedColumns.filter(_ => _ !== 'status') : displayedColumns;
  }

  trackByFn(index: number, item: Cage): string {
    return item.id;
  }
}
