import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort, SortDirection } from '@angular/material/sort';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Chemical } from '../shared/chemical';
import { SdsService } from '../shared/sds.service';

@Component({
  selector: 'gcp-sds-list',
  templateUrl: './sds-list.component.html',
  styleUrls: ['./sds-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SdsListComponent implements OnInit {
  private ownState = this.shared.branch;
  private loadList!: boolean;
  private chemicals!: Chemical[];

  public textFilter = new FormControl(this.route.snapshot.paramMap.get('search'));
  public groupFilter = new FormControl(this.route.snapshot.paramMap.get('groupby'));
  public loading = this.sdsService.loading;
  public displayedColumns = ['sds', 'bin', 'product', 'onHand', 'packingGroup', 'class', 'hazardRating'];
  public chemicals$!: Observable<Chemical[]>;
  public branchFilter = new FormControl({value: this.ownState, disabled: false});
  public states = this.shared.branches;
  public address$ = this.shared.getAddress();
  public date = new Date();
  public sortSort = this.route.snapshot.queryParamMap.get('sort') || '';
  public sortOrder = this.route.snapshot.queryParamMap.get('order') as SortDirection;
  public classes = {
    3: 'Flammable',
    5.1: 'Oxidiser',
    6.1: 'Poison',
    8: 'Corrosive',
    9: 'Miscellaneous'
  };
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private sdsService: SdsService
  ) { }

  ngOnInit(): void {
    const branch$ = this.shared.getBranch();
    this.chemicals$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => branch$.pipe(map(branch => _['branch'] === undefined ? {..._, branch} : _))),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this.loadList ? this.getChemicals(_['search'], _['branch'], _['sort'], _['order']) : []),
      tap(_ => this.chemicals = _)
    );

    this.textFilter.valueChanges.pipe(
      map(_ => _ && _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'search': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
    } else {
      this.branchFilter.patchValue('');
    }
    if ('search' in params) {
      this.textFilter.patchValue(params['search']);
    } else {
      if (this.textFilter.value) this.textFilter.patchValue('');
    }
    if ('sort' in params) {
      this.sortSort = params['sort'];
      this.sortOrder = params['order'];
    } else {
      this.sortSort = '';
      this.sortOrder = '';
    }
    if ('groupby' in params) {
      this.groupFilter.patchValue(params['groupby']);
    } else {
      this.groupFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this.loadList && this.route.children.length === 0) {
      this.loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameBranch = prev['branch'] === curr['branch'];
    const sameSearch = prev['search'] === curr['search'];
    const sameSort = prev['sort'] === curr['sort'];
    const sameOrder = prev['order'] === curr['order'];
    return this.loadList && sameBranch && sameSearch && sameSort && sameOrder;
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setGroup(view: MatSelectChange): void {
    this.router.navigate([], { queryParams: {groupby: view.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  getChemicals(search: string, branch: string, sort: string, order: string): Observable<Chemical[]> {
    search = (search || '').toLowerCase();
    return this.sdsService.getOnHandChemicals(branch, sort, order).pipe(
      map(_ => _.filter(c => c.ItemNmbr?.toLowerCase()?.includes(search)))
    )
  }

  clearTextFilter(): void {
    this.textFilter.patchValue('');
  }

  getTotalRequestedQty(lines: Array<any>, key: string): number {
    return lines.reduce((acc, cur) => acc + cur[key], 0);
  }

  getTotalWeight(lines: Array<any>, key: string, uofm: string): number {
    return lines.filter(_ => _['uofm'] === uofm).reduce((acc, cur) => acc + cur[key], 0);
  }

  exportChemicals(): void {
    if (!this.chemicals || this.chemicals.length === 0) this.snackBar.open('Nothing to export', '', {duration: 3000})
    const now = new Date();
    const branch = this.branchFilter.value;
    const fileName = `GCP_${branch ? branch + '_' : ''}chemicals_${now.toLocaleString( 'sv', { timeZoneName: 'short' } ).split(' ', 2).join('_')}.csv`
    this.sdsService.exportToCsv(fileName, this.chemicals);
  }

  announceSortChange(e: Sort): void {
    const sort = e.direction ? e.active : null;
    const order = e.direction || null;
    this.router.navigate([], { queryParams: {sort, order}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByGroupsFn(index: number, item: any): string {
    return item.key;
  }

  trackByFn(index: number, item: Chemical): string {
    return item.ItemNmbr;
  }

}
