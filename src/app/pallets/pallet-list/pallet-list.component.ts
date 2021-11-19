import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { Pallet } from '../shared/pallet';
import { PalletsService } from '../shared/pallets.service';

@Component({
  selector: 'gcp-pallet-list',
  templateUrl: './pallet-list.component.html',
  styleUrls: ['./pallet-list.component.css']
})
export class PalletListComponent implements OnInit {
  public pallets$: Observable<Pallet[]>;
  public binFilter = new FormControl('');
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public palletFilter = new FormControl('');
  public customers$: Observable<any[]>;
  public total: number;
  private _loadList: boolean;
  public states = ['NSW', 'QLD', 'SA', 'VIC', 'WA'];
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public displayedColumns = ['date', 'to', 'pallet', 'quantity'];

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
    const state$ = this.sharedService.getState();
    this.pallets$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => state$.pipe(map(state => !_['branch'] ? {..._, branch: state} : _))),
      tap(_ => this.parseParams(_)),
      tap(() => this.total = 0),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(pallets => this.total = pallets.map(_ => _.fields.Change).filter(_ => _).reduce((acc, val) => acc + val, 0))
    )
  }

  getFirstPage(_: any) {
    this.sharedService.getState().subscribe(_ => console.log(_))

    return this.palletsService.getFirstPage(_).pipe(map(_=> {
      return _.map(pallet =>  {
        pallet.fields['To'] = pallet.fields.From === this.branchFilter.value ? pallet.fields.To : pallet.fields.From;
        pallet.fields['Change'] = pallet.fields.From === this.branchFilter.value ? -pallet.fields.Quantity : +pallet.fields.Quantity;
        return pallet
      })
    }),
    tap(_ => console.log(_)));

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
    if ('pallet' in params) {
      this.palletFilter.patchValue(params['pallet']);
      filters['pallet'] = params['pallet'];
    } else {
      this.palletFilter.patchValue('');
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
    const samePallet = prev['pallet'] === curr['pallet'];
    const sameStatus = prev['status'] === curr['status'];
    return sameBranch && sameBin && samePallet && sameStatus && this._loadList;
  }

  setBranch(branch: MatSelectChange ) {
    this.router.navigate(['pallets/history'], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setStatus(status: MatSelectChange ) {
    this.router.navigate(['pallets/history'], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setPallet(pallet: MatSelectChange ) {
    this.router.navigate(['pallets/history'], { queryParams: {pallet: pallet.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearBinFilter() {
    this.binFilter.patchValue('');
  }

  trackByFn(index: number, item: Pallet) {
    return item.id;
  }
}
