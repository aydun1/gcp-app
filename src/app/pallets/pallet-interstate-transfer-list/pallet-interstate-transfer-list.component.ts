import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { PalletsService } from '../shared/pallets.service';
import { Pallet } from '../shared/pallet';

@Component({
  selector: 'gcp-pallet-interstate-transfer-list',
  templateUrl: './pallet-interstate-transfer-list.component.html',
  styleUrls: ['./pallet-interstate-transfer-list.component.css']
})
export class PalletInterstateTransferListComponent implements OnInit {
  public pallets$: Observable<Pallet[]>;
  public fromFilter = new FormControl('');
  public toFilter = new FormControl('');
  public assetTypeFilter = new FormControl('');
  public customers$: Observable<any[]>;
  public total: number;
  private _loadList: boolean;
  public displayedColumns = ['date', 'reference', 'pallet', 'from', 'to', 'quantity', 'approved'];
  public states = this.sharedService.branches;
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
    this.pallets$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      map(_ => {return {..._, type: 'Transfer'}}),
      tap(() => this.total = 0),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(pallets => this.total = pallets.map(_ => _.fields.Quantity).filter(_ => _).reduce((acc, val) => acc + val, 0))
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
      this.fromFilter.patchValue(params['from']);
      filters['from'] = params['from'];
    } else {
      this.fromFilter.patchValue('');
    }
    if ('to' in params) {
      this.toFilter.patchValue(params['to']);
      filters['to'] = params['to'];
    } else {
      this.toFilter.patchValue('');
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
    return sameFrom && sameTo && this._loadList;
  }

  setFrom(from: MatSelectChange ) {
    this.router.navigate([], { queryParams: {from: from.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setTo(to: MatSelectChange ) {
    this.router.navigate([], { queryParams: {to: to.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setAssetType(assetType: MatSelectChange ) {
    this.router.navigate([], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  approve(id: string) {
    this.palletsService.approveInterstatePalletTransfer(id, true).subscribe();
  }

  trackByFn(index: number, item: Pallet) {
    return item.id;
  }
}
