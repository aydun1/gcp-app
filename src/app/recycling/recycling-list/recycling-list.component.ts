import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { Cage } from '../shared/cage';
import { Column } from '../../shared/column';
import { RecyclingService } from '../shared/recycling.service';

@Component({
  selector: 'gcp-recycling-list',
  templateUrl: './recycling-list.component.html',
  styleUrls: ['./recycling-list.component.css']
})
export class RecyclingListComponent implements OnInit {
  public cages$: Observable<Cage[]>;
  public binFilter = new FormControl('');
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public assetTypeFilter = new FormControl('');
  public customers$: Observable<any[]>;
  public weight: number;
  private _loadList: boolean;
  public displayedColumns = ['cageNumber', 'assetType', 'status', 'weight'];

  public choices$: Observable<any>;
  public Status: Column;

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private recyclingService: RecyclingService,
    private sharedService: SharedService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: any) {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    this.getOptions();
    this.cages$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      tap(() => this.weight = 0),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(cages => this.weight = cages.map(_ => _.fields.Weight).filter(_ => _).reduce((acc, val) => acc + val, 0))
    )

    this.binFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _ > 0 ? _ : null),
      tap(_ => this.router.navigate(['recycling'], { queryParams: {'bin': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  getOptions(): void {
    this.choices$ = this.recyclingService.getColumns();
  }

  getFirstPage(_: any) {
    this.sharedService.getState().subscribe(_ => console.log(_))

    return this.recyclingService.getFirstPage(_);

  }

  getNextPage() {
    return this.recyclingService.getNextPage();
  }

  parseParams(params: Params) {
    if (!params) return;
    const filters: any = {};
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
    if ('bin' in params) {
      this.binFilter.patchValue(params['bin']);
      filters['bin'] = params['bin'];
    } else {
      if (this.binFilter.value) this.binFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params) {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameBranch = prev['branch'] === curr['branch'];
    const sameBin = prev['bin'] === curr['bin'];
    const sameAssetType = prev['assetType'] === curr['assetType'];
    const sameStatus = prev['status'] === curr['status'];
    return sameBranch && sameBin && sameAssetType && sameStatus && this._loadList;
  }

  setBranch(branch: MatSelectChange ) {
    this.router.navigate(['recycling'], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setStatus(status: MatSelectChange ) {
    this.router.navigate(['recycling'], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setAssetType(assetType: MatSelectChange ) {
    this.router.navigate(['recycling'], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearBinFilter() {
    this.binFilter.patchValue('');
  }

  trackByFn(index: number, item: Cage) {
    return item.id;
  }
}
