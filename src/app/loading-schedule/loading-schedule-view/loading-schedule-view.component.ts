import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostBinding, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, Observable, Subject, switchMap, tap, throwError } from 'rxjs';

import { SharedService } from '../../shared.service';
import { NavigationService } from '../../navigation.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';

@Component({
  selector: 'gcp-loading-schedule-view',
  templateUrl: './loading-schedule-view.component.html',
  styleUrls: ['./loading-schedule-view.component.css']
})
export class LoadingScheduleViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';

  private scheduleSource$!: Subject<string | null>;
  public loadingScheduleEntry$!: Observable<any>;
  public loading = false;
  public edit = false;
  public loadingPage = new BehaviorSubject<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private navService: NavigationService,
    private loadingScheduleService: LoadingScheduleService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.scheduleSource$ = new BehaviorSubject<string | null>(id);
    this.loadingScheduleEntry$ = this.scheduleSource$.pipe(
      switchMap(_ => combineLatest([this.loadingScheduleService.getLoadingScheduleEntry(_), this.sharedService.getBranch()])),
      tap(([transfer, state]) => {
        this.loadingPage.next(false);
      }),
      map(_ => _[0]),
      catchError((err: HttpErrorResponse) => this.handleError(err, true))
    );
  }

  handleError(err: HttpErrorResponse, redirect = false): Observable<never> {
    const message = err.error?.error?.message || 'Unknown error';
    this.snackBar.open(message, '', {duration: 3000});
    this.loading = false;
    if (redirect) this.navService.back();
    return throwError(() => new Error(message));
  }

  goBack(): void {
    this.navService.back();
  }
}
