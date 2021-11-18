import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { Pallet } from '../shared/pallet';
import { PalletsService } from '../shared/pallets.service';

@Component({
  selector: 'gcp-pallet-interstate-transfer-list',
  templateUrl: './pallet-interstate-transfer-list.component.html',
  styleUrls: ['./pallet-interstate-transfer-list.component.css']
})
export class PalletInterstateTransferListComponent implements OnInit {
  public pallets$: Observable<Pallet[]>;
  public binFilter = new FormControl('');
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public assetTypeFilter = new FormControl('');
  public customers$: Observable<any[]>;
  public weight: number;
  private _loadList: boolean;
  public displayedColumns = ['date', 'customer', 'pallet', 'out', 'in', 'count'];

  public choices$: Observable<any>;
  public Status: any;

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private palletsService: PalletsService,
    private sharedService: SharedService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: any) {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    this.getOptions();
    this.pallets$ = this.route.queryParams.pipe(
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
      tap(pallets => this.weight = pallets.map(_ => _.fields.Weight).filter(_ => _).reduce((acc, val) => acc + val, 0))
    )

  }

  getOptions(): void {
    //this.choices$ = this.palletsService.getColumns();
  }

  getFirstPage(_: any) {
    this.sharedService.getState().subscribe(_ => console.log(_))

    return this.palletsService.getFirstPage(_);

  }

  getNextPage() {
    return this.palletsService.getNextPage();
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
    this.router.navigate(['pallets'], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setStatus(status: MatSelectChange ) {
    this.router.navigate(['pallets'], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setAssetType(assetType: MatSelectChange ) {
    this.router.navigate(['pallets'], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearBinFilter() {
    this.binFilter.patchValue('');
  }

  trackByFn(index: number, item: Pallet) {
    return item.id;
  }
}
