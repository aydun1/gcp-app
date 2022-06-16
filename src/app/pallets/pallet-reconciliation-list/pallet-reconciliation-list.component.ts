import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { PalletsReconciliationService } from '../shared/pallets-reconciliation.service';
import { Reconciliation } from '../shared/reconciliation';

@Component({
  selector: 'gcp-pallet-reconciliation-list',
  templateUrl: './pallet-reconciliation-list.component.html',
  styleUrls: ['./pallet-reconciliation-list.component.css']
})
export class PalletReconciliationListComponent implements OnInit {
  private _loadList!: boolean;
  public pallets$!: Observable<Reconciliation[]>;
  public branchFilter = new FormControl('');
  public palletFilter = new FormControl('');
  public loading = this.palletsReconciliationService.loading;
  public total!: number;
  public displayedColumns = ['date', 'reference', 'branch', 'pallet', 'surplus', 'deficit'];
  public states = this.sharedService.branches;
  public pallets = ['Loscam', 'Chep', 'Plain']

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private palletsReconciliationService: PalletsReconciliationService,
    private sharedService: SharedService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    this.pallets$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      map(_ => {return {..._, type: 'Transfer'}}),
      tap(() => this.total = 0),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(pallets => this.total = pallets.map(_ => _.fields.Quantity).filter(_ => _).reduce((acc, val) => acc + val, 0)),
    )
  }

  getFirstPage(_: Params): BehaviorSubject<Reconciliation[]> {
    this.sharedService.getBranch().subscribe();
    return this.palletsReconciliationService.getFirstPage(_);
  }

  getNextPage(): void {
    this.palletsReconciliationService.getNextPage();
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
    if ('pallet' in params) {
      this.palletFilter.patchValue(params['pallet']);
      filters['pallet'] = params['pallet'];
    } else {
      this.palletFilter.patchValue('');
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
    const samePallet = prev['pallet'] === curr['pallet'];
    return sameBranch && samePallet && this._loadList;
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setPallet(pallet: MatSelectChange): void {
    this.router.navigate([], { queryParams: {pallet: pallet.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  trackByFn(index: number, item: Reconciliation): string {
    return item.id;
  }
}
