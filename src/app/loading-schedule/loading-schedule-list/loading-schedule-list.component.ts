import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { LoadingSchedule } from '../shared/loading-schedule';
import { LoadingScheduleService } from '../shared/loading-schedule.service';

@Component({
  selector: 'gcp-loading-schedule-list',
  templateUrl: './loading-schedule-list.component.html',
  styleUrls: ['./loading-schedule-list.component.css']
})
export class LoadingScheduleListComponent implements OnInit {
  private _loadingScheduleSubject$ = new BehaviorSubject<LoadingSchedule[]>([]);
  private _loadList!: boolean;
  public branchFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public viewFilter = new FormControl('');
  public loadingSchedules$!: Observable<LoadingSchedule[]>;
  public deliveries!: LoadingSchedule[];
  public loadingList$ = this.loadingScheduleService.loading;
  public loading = false;
  public displayedColumns = ['reference', 'loadingDate', 'arrivalDate', 'transportCompany', 'spaces', 'status', 'notes', 'menu'];
  public listSize!: number;
  public groups!: Array<string>;
  public grouped!: boolean;
  public totals!: object;
  public states = this.shared.branches;
  public state = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();

    this.loadingSchedules$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(params => state$.pipe(
        map(state => {
          this.state = state;
          return !params['branch'] ? {...params, branch: state} : {...params};
        })
      )),
      tap(_ => {
        this.parseParams(_);
        this.groups = _['view'] === 'grouped' ? ['Pan list sent', 'Scheduled', 'Delivered'] : [];
        this.displayedColumns = _['view'] === 'grouped' ?
          ['reference', 'loadingDate', 'arrivalDate', 'transportCompany', 'spaces', 'notes', 'menu'] :
          ['reference', 'loadingDate', 'arrivalDate', 'transportCompany', 'spaces', 'status', 'notes', 'menu'];
      }),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(_ => this._loadingScheduleSubject$.next(_)),
      tap(_ => {
        this.totals = this.groups.reduce((acc, curr) => (acc[curr] = _.filter(res => res.fields?.Status === curr).reduce((a, b) =>  a + (b.fields?.Spaces || 0), 0), acc), {});
        this.totals['total'] = _.reduce((a, b) =>  a + (b.fields?.Spaces || 0), 0);
      }),
      switchMap(_ => this._loadingScheduleSubject$)
    )
  }

  getFirstPage(params: Params): Observable<LoadingSchedule[]> {
    return this.loadingScheduleService.getFirstPage(params);
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
    } else {
      this.branchFilter.patchValue('');
    }
    if ('status' in params) {
      this.statusFilter.patchValue(params['status']);
    } else {
      this.statusFilter.patchValue('');
    }
    if ('view' in params) {
      this.viewFilter.patchValue(params['view']);
    } else {
      this.viewFilter.patchValue('');
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
    const sameStatus = prev['status'] === curr['status'];
    const sameView = prev['view'] === curr['view'];
    return sameBranch && sameStatus && sameView && this._loadList;
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setStatus(status: MatSelectChange): void {
    this.router.navigate([], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setView(view: MatSelectChange): void {
    this.router.navigate([], { queryParams: {view: view.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  markDelivered(id: string) {
    this.loadingScheduleService.markDelivered(id).subscribe();
  }

  deleteEntry(id: string) {

  }

  trackByFn(index: number, item: LoadingSchedule): string {
    return item.id;
  }

}
