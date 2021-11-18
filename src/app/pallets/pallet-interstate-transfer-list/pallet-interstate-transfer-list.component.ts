import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { InterstatePalletTransferService } from '../shared/interstate-pallet-transfer.service';
import { Pallet } from '../shared/pallet';

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
  public displayedColumns = ['date', 'reference', 'pallet', 'from', 'to', 'quantity', 'approved'];

  public choices$: Observable<any>;
  public Status: any;

  get states(): Array<string> {
    return this.sharedService.regions;
  }

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private palletsService: InterstatePalletTransferService,
    private sharedService: SharedService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: any) {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
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
    this.getOptions();
  }

  getOptions(): void {
    this.choices$ = this.palletsService.getColumns();
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
    if ('from' in params) {
      this.branchFilter.patchValue(params['from']);
      filters['from'] = params['from'];
    } else {
      this.branchFilter.patchValue('');
    }
    if ('to' in params) {
      this.statusFilter.patchValue(params['to']);
      filters['to'] = params['to'];
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
    const sameFrom = prev['from'] === curr['from'];
    const sameTo = prev['to'] === curr['to'];
    return sameTo && sameTo && this._loadList;
  }

  setFrom(from: MatSelectChange ) {
    this.router.navigate(['pallets/transfer'], { queryParams: {from: from.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setTo(to: MatSelectChange ) {
    this.router.navigate(['pallets/transfer'], { queryParams: {to: to.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setAssetType(assetType: MatSelectChange ) {
    this.router.navigate(['pallets/transfer'], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearBinFilter() {
    this.binFilter.patchValue('');
  }

  trackByFn(index: number, item: Pallet) {
    return item.id;
  }
}
