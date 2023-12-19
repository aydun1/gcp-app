import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { LoadingSchedule } from '../shared/loading-schedule';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { StringColourPipe } from '../../shared/pipes/string-colour.pipe';
import { GroupByPipe } from '../../shared/pipes/group-by.pipe';
import { LoadingRowComponent } from '../../shared/loading/loading-row/loading-row.component';

@Component({
  selector: 'gcp-loading-schedule-list',
  templateUrl: './loading-schedule-list.component.html',
  styleUrls: ['./loading-schedule-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgForOf, NgIf, ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatMenuModule, MatSelectModule, MatTableModule, LetterheadComponent, GroupByPipe, StringColourPipe, LoadingRowComponent]
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
  public totals!: any;
  public states = this.shared.branches;
  public state = '';

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.loadingScheduleService.getNextPage();
  }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();

    this.loadingSchedules$ = this.route.queryParams.pipe(
      startWith({} as any),
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
        this.totals = this.groups.reduce((acc, curr) =>
          (acc[curr] = _.filter(res => res.fields?.Status === curr).reduce((a, b) =>  a + (b.fields?.Spaces || 0), 0), acc), {} as any
        );
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

  markPanListSent(id: string): void {
    this.loadingScheduleService.markPanSent(id).subscribe();
  }

  markDelivered(id: string): void {
    this.loadingScheduleService.markDelivered(id).subscribe();
  }

  allowNext(to: string, from: string): boolean {
    return !(to === this.state || from === this.state && to === 'International');
  }

  trackByFn(index: number, item: LoadingSchedule): string {
    return item.id;
  }

}
