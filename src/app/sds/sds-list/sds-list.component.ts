import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Chemical } from '../chemical';
import { SdsService } from '../sds.service';

@Component({
  selector: 'gcp-sds-list',
  templateUrl: './sds-list.component.html',
  styleUrls: ['./sds-list.component.css']
})
export class SdsListComponent implements OnInit {
  private ownState = this.shared.branch;
  private loadList!: boolean;

  public loading = false;
  public displayedColumns = ['sds', 'bin', 'product', 'onHand', 'packingGroup', 'hazardRating'];
  public chemicals$!: Observable<Chemical[]>;
  public branchFilter = new FormControl({value: this.ownState, disabled: false});
  public states = this.shared.branches;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
      switchMap(_ => branch$.pipe(map(branch => !_['branch'] ? {..._, branch} : _))),
      tap(_ => {
        this.parseParams(_);
      }),
      switchMap(_ => this.loadList ? this.sdsService.getOnHandChemicals(_['branch']) : [])
    )
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
    } else {
      this.branchFilter.patchValue('');
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
    return this.loadList && sameBranch;
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  trackByFn(index: number, item: Chemical): string {
    return item.ItemNmbr;
  }

}
