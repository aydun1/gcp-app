import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { LoadingSchedule } from '../shared/loading-schedule';
import { LoadingScheduleService } from '../shared/loading-schedule.service';

@Component({
  selector: 'gcp-loading-schedule-list',
  templateUrl: './loading-schedule-list.component.html',
  styleUrls: ['./loading-schedule-list.component.css']
})
export class LoadingScheduleListComponent implements OnInit {
  private _loadingScheduleSubject$ = new BehaviorSubject<LoadingSchedule[]>([]);
  private _loadList: boolean;
  public loadingSchedule$: Observable<LoadingSchedule[]>;
  public deliveries: LoadingSchedule[];
  public loadingList$ = this.loadingScheduleService.loading;
  public loading: false;
  public displayedColumns = ['loadingDate', 'arrivalDate', 'transportCompany', 'spaces', 'status', 'notes', 'edit'];
  public listSize: number;
  public groups = ['Pan list sent', 'Scheduled', 'Delivered'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();

    this.loadingSchedule$ = this.route.queryParams.pipe(
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
      }),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(_ => this._loadingScheduleSubject$.next(_)),
      tap(_ => this.listSize = _.length),
      switchMap(_ => this._loadingScheduleSubject$)
    )
  }

  getFirstPage(params: Params): Observable<LoadingSchedule[]> {
    return this.loadingScheduleService.getFirstPage(params);
  }

  parseParams(params: Params): void {
    if (!params) return;
    const filters: Params = {};
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    return true && this._loadList;
  }

  deleteEntry(id: string) {

  }

  trackByFn(index: number, item: LoadingSchedule): string {
    return item.id;
  }

}
