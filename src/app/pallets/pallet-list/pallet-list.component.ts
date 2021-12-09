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
  private _loadList: boolean;
  public pallets$: Observable<Pallet[]>;
  public binFilter = new FormControl('');
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public palletFilter = new FormControl('');
  public nameFilter = new FormControl('');
  public customers$: Observable<any[]>;
  public loading: boolean;
  public totalOut = 0;
  public totalIn = 0;
  public states = this.sharedService.branches;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public displayedColumns = ['date', 'notes', 'recepient', 'pallet', 'out', 'in', 'docket'];
  public alll$;
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
    this.alll$ = this.palletsService.getAll();

    const state$ = this.sharedService.getBranch();
    this.pallets$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => state$.pipe(map(state => !_['branch'] ? {..._, branch: state} : _))),
      tap(_ => {
        this.parseParams(_);
        this.totalIn = 0;
        this.totalOut = 0;
      }),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(pallets => {
        this.totalOut = pallets.map(_ => _.fields.Out).filter(_ => _).reduce((acc, val) => acc + val, 0);
        this.totalIn = pallets.map(_ => _.fields.In).filter(_ => _).reduce((acc, val) => acc + val, 0);
      })
    )

    this.palletsService.getColumns();

    this.nameFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'name': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  getFirstPage(params: Params) {
    return this.palletsService.getFirstPage(params).pipe(
      map(_=>
        _.map(pallet =>  {
          const source = pallet.fields.From === this.branchFilter.value;
          const inn = source ? null: +pallet.fields.Quantity;
          const out = source ? +pallet.fields.Quantity : null;
          pallet.fields['To'] = source ? pallet.fields.To : pallet.fields.From;
          pallet.fields['In'] = inn;
          pallet.fields['Out'] = out;
          pallet.fields['Change'] = pallet.fields.From === this.branchFilter.value ? -pallet.fields.Quantity : +pallet.fields.Quantity;
          return pallet;
        })
      )
    );
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
    if ('pallet' in params) {
      this.palletFilter.patchValue(params['pallet']);
      filters['pallet'] = params['pallet'];
    } else {
      this.palletFilter.patchValue('');
    }
    if ('name' in params) {
      this.nameFilter.patchValue(params['name']);
      filters['name'] = params['name'];
    } else {
      if (this.nameFilter.value) this.nameFilter.patchValue('');
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
    const samePallet = prev['pallet'] === curr['pallet'];
    const sameName = prev['name'] === curr['name'];
    return sameBranch && samePallet && sameName && this._loadList;
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

  clearNameFilter() {
    this.nameFilter.patchValue('');
  }

  trackByFn(index: number, item: Pallet) {
    return item.id;
  }


  removeid(id) {
    this.palletsService.removeId(id).subscribe();
  }
}
