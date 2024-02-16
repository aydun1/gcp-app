import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { LoadingSchedule } from '../shared/loading-schedule';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { StringColourPipe } from '../../shared/pipes/string-colour.pipe';
import { GroupByPipe } from '../../shared/pipes/group-by.pipe';
import { LoadingPageComponent } from '../../shared/loading/loading-page/loading-page.component';
import { LoadingRowComponent } from '../../shared/loading/loading-row/loading-row.component';

@Component({
  selector: 'gcp-loading-schedule-list',
  templateUrl: './loading-schedule-list.component.html',
  styleUrls: ['./loading-schedule-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatMenuModule, MatSelectModule, MatTableModule, LetterheadComponent, GroupByPipe, StringColourPipe, LoadingPageComponent, LoadingRowComponent]
})
export class LoadingScheduleListComponent implements OnInit {
  private _loadList!: boolean;
  private state = '';
  public branch = '';
  public status = '';
  public view = '';
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
      startWith({} as Params),
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
      switchMap(_ => this._loadList ? this.loadingScheduleService.getFirstPage(_) : []),
      tap(_ => {
        this.totals = this.groups.reduce((acc, curr) =>
          (acc[curr] = _.filter(res => res.fields?.Status === curr).reduce((a, b) =>  a + (b.fields?.Spaces || 0), 0), acc), {} as any
        );
        this.totals['total'] = _.reduce((a, b) =>  a + (b.fields?.Spaces || 0), 0);
      }),
    )
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('branch' in params) {
      this.branch = params['branch'];
    } else {
      this.branch = '';
    }
    if ('status' in params) {
      this.status = params['status'];
    } else {
      this.status = '';
    }
    if ('view' in params) {
      this.view = 'view';
    } else {
      this.view = '';
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
