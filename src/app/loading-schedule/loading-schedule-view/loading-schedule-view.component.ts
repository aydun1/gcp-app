import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostBinding, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, Observable, Subject, switchMap, tap, throwError } from 'rxjs';

import { SharedService } from '../../shared.service';
import { NavigationService } from '../../navigation.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

@Component({
  selector: 'gcp-loading-schedule-view',
  templateUrl: './loading-schedule-view.component.html',
  styleUrls: ['./loading-schedule-view.component.css']
})
export class LoadingScheduleViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  private scheduleSource$!: Subject<string | null>;
  public loadingScheduleEntry$!: Observable<any>;
  public loading = false;
  public edit = false;
  public selectedPan = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private navService: NavigationService,
    private loadingScheduleService: LoadingScheduleService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.scheduleSource$ = new BehaviorSubject<string | null>(id);
    const loadingSchedule$ = this.scheduleSource$.pipe(
      switchMap(_ => this.loadingScheduleService.getLoadingScheduleEntry(_))
    );
    this.loadingScheduleEntry$ = combineLatest([loadingSchedule$, this.sharedService.getBranch()]).pipe(
      map(_ => _[0]),
      catchError((err: HttpErrorResponse) => this.handleError(err, true))
    );
  }

  setPan(panId: MatButtonToggleChange): void {
    this.router.navigate([], { queryParams: {pan: panId.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  handleError(err: HttpErrorResponse, redirect = false): Observable<never> {
    const message = err.error?.error?.message || 'Unknown error';
    this.snackBar.open(message, '', {duration: 3000});
    this.loading = false;
    if (redirect) this.navService.back();
    return throwError(() => new Error(message));
  }

  addPanList(id: string) {
    this.loadingScheduleService.addPanList(id).then(_ => {
      this.fetchData(id);
      const pla = _.fields.PanListsArray || [];
      this.selectedPan = pla[pla.length  - 1][0] || '';
    });
  }

  fetchData(id: string) {
    this.scheduleSource$.next(id);
  }

  goBack(): void {
    this.navService.back();
  }
}
