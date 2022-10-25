import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostBinding, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { NavigationService } from '../../navigation.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { LoadingSchedule } from '../shared/loading-schedule';

@Component({
  selector: 'gcp-loading-schedule-view',
  templateUrl: './loading-schedule-view.component.html',
  styleUrls: ['./loading-schedule-view.component.css']
})
export class LoadingScheduleViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  private scheduleSource$ = new BehaviorSubject<string | LoadingSchedule | null>(null);
  public loadingScheduleEntry$!: Observable<any>;
  public date = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private navService: NavigationService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.scheduleSource$.next(id);
    const loadingSchedule$ = this.scheduleSource$.pipe(
      switchMap(_ => 
        typeof _ === 'string' ? this.loadingScheduleService.getLoadingScheduleEntry(_) : of(_)
      )
    );
    this.loadingScheduleEntry$ = loadingSchedule$.pipe(
      tap(_ => this.goToPanList(_)),
      catchError((err: HttpErrorResponse) => this.handleError(err, true))
    );
  }

  handleError(err: HttpErrorResponse, redirect = false): Observable<never> {
    const message = err.error?.error?.message || 'Unknown error';
    this.snackBar.open(message, '', {duration: 3000});
    if (redirect) this.navService.back();
    return throwError(() => new Error(message));
  }

  addPanList(id: string): void {
    this.loadingScheduleService.addPanList(id).then(_ => 
      this.scheduleSource$.next(_)
    );
  }

  deletePanList(id: string, panListId: string): void {
    this.loadingScheduleService.removePanList(id, panListId).then(_ => 
      this.scheduleSource$.next(_)
    );
  }

  sendPanList(id: string, panListId: string): void {
    this.loadingScheduleService.sendPanList(id, panListId).then(_ => {
      this.fetchData(id);
      this.snackBar.open('Pan list sent', '', {duration: 3000})
    });
  }

  goToPanList(ls: LoadingSchedule | null): void {
    const panId = this.route.snapshot.queryParams['pan'];
    if (!ls) return;
    const pans = ls.fields.PanListsArray?.map(_ => _[0]) || [];
    const pan = pans.find(_ => _ === panId) ? panId : pans.length > 0 ? pans[pans.length  - 1] : null;
    this.router.navigate([], { queryParams: {pan}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  fetchData(id: string): void {
    this.scheduleSource$.next(id);
  }

  goBack(): void {
    this.navService.back();
  }
}
