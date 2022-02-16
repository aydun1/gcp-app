import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { Cage } from '../shared/cage';
import { RecyclingService } from '../shared/recycling.service';

@Component({
  selector: 'gcp-recycling-list',
  templateUrl: './recycling-list.component.html',
  styleUrls: ['./recycling-list.component.css']
})
export class RecyclingListComponent implements OnInit {
  private _loadList: boolean;
  public cages$: Observable<Cage[]>;
  public binFilter = new FormControl('');
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public assetTypeFilter = new FormControl('');
  public loading = this.recyclingService.loading;
  public weight: number;
  public count: number;
  public displayedColumns = ['fields/CageNumber', 'assetType', 'status', 'fields/Modified', 'weight'];
  public sortSort: string;
  public sortOrder: 'asc' | 'desc';
  public choices$: BehaviorSubject<any>;

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
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      tap(() => this.weight = 0),
      tap(() => this.count = 0),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(cages => this.weight = cages.map(_ => _.fields.Weight).filter(_ => _).reduce((acc, val) => acc + val, 0)),
      tap(cages => this.count = cages.map(() => 1).reduce((acc, val) => acc + val, 0))

    )

    this.binFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _ > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'bin': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  getOptions(): void {
    this.choices$ = this.recyclingService.getColumns();
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
      if (this.binFilter.value) this.binFilter.patchValue('');
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

  setStatus(status: MatSelectChange): void {
    this.router.navigate([], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setAssetType(assetType: MatSelectChange): void {
    this.router.navigate([], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearBinFilter(): void {
    this.binFilter.patchValue('');
  }

  announceSortChange(e: Sort) {
    const sort = e.direction ? e.active : null;
    const order = e.direction || null;
    this.router.navigate([], { queryParams: {sort, order}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByFn(index: number, item: Cage): string {
    return item.id;
  }
}
