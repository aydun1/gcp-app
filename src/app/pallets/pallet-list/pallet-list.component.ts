import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Pallet } from '../shared/pallet';
import { PalletDocketDialogComponent } from '../shared/pallet-docket-dialog/pallet-docket-dialog.component';
import { PalletsService } from '../shared/pallets.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { LoadingRowComponent } from '../../shared/loading/loading-row/loading-row.component';

@Component({
  selector: 'gcp-pallet-list',
  templateUrl: './pallet-list.component.html',
  styleUrls: ['./pallet-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatSelectModule, MatTableModule, LetterheadComponent, LoadingRowComponent]
})
export class PalletListComponent implements OnInit {
  private _loadList!: boolean;
  public pallets$!: Observable<Pallet[]>;
  public branchFilter = new FormControl('');
  public palletFilter = new FormControl('');
  public nameFilter = new FormControl('');
  public loading = this.palletsService.loading;
  public totalOut = 0;
  public totalIn = 0;
  public states = this.sharedService.branches;
  public pallets = this.sharedService.pallets;
  public displayedColumns = ['date', 'notes', 'recepient', 'pallet', 'out', 'in', 'docket'];

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private palletsService: PalletsService,
    private sharedService: SharedService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    const branch$ = this.sharedService.getBranch();

    this.pallets$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _ as {branch: string})
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap((_) => branch$.pipe(map(state => !_['branch'] ? {..._, branch: state} : _))),
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

    this.nameFilter.valueChanges.pipe(
      debounceTime(200),
      map(_ => _ && _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'name': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  getFirstPage(params: Params): Observable<Pallet[]> {
    return this.palletsService.getFirstPage(params, true).pipe(
      map(_=>
        _.map(pallet =>  {
          const isSource = pallet.fields.From === this.branchFilter.value;
          pallet.fields['To'] = isSource ? pallet.fields.To : pallet.fields.From;
          pallet.fields['In'] = pallet.fields.CustomerNumber ? +pallet.fields.In || 0 : isSource ? 0 : +pallet.fields.Quantity;
          pallet.fields['Out'] = pallet.fields.CustomerNumber ? +pallet.fields.Out || 0 : isSource ? +pallet.fields.Quantity : 0;
          return pallet;
        })
      )
    );
  }

  getNextPage(): void {
    this.palletsService.getNextPage();
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
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

  compareQueryStrings(prev: Params, curr: Params): boolean {
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

  setBranch(branch: MatSelectChange): void {
    this.router.navigate(['pallets/history'], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setStatus(status: MatSelectChange): void {
    this.router.navigate(['pallets/history'], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setPallet(pallet: MatSelectChange): void {
    this.router.navigate(['pallets/history'], { queryParams: {pallet: pallet.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearNameFilter(): void {
    this.nameFilter.patchValue('');
  }

  openRecyclingDocketDialog(id: string): void {
    const data = {id};
    const dialogRef = this.dialog.open(PalletDocketDialogComponent, {width: '864px', data, autoFocus: false});
    dialogRef.afterClosed().subscribe();
  }

  trackByFn(index: number, item: Pallet): string {
    return item.id;
  }

}
