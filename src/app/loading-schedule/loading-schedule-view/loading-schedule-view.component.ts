import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';

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

  public loadingScheduleEntry$!: Observable<any>;
  public date = new Date();
  public notes = new FormControl<string>('');
  public panNote!: string;
  public panIdsString!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private navService: NavigationService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const loadingSchedule$ = this.loadingScheduleService.getLoadingScheduleEntry(id);

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
    this.loadingScheduleService.addPanList(id);
  }

  deletePanList(id: string, panListId: string): void {
    this.loadingScheduleService.removePanList(id, panListId);
  }

  sendPanList(id: string, panListId: string): void {
    this.loadingScheduleService.sendPanList(id, panListId).then(_ => {
      this.snackBar.open('Pan list sent', '', {duration: 3000})
    });
  }

  goToPanList(ls: LoadingSchedule | null): void {
    const panId = this.route.snapshot.queryParams['pan'];
    if (!ls) return;
    const newPans = ls.fields.PanListsArray || [];
    const panIdsString = ls.fields.PanListsArray?.map(_ => _[0]).join(',') || '';
    const selectedPan = newPans.find(_ => _[0] === panId);
    const pan = selectedPan ? panId : newPans.length > 0 ? newPans[newPans.length  - 1][0] : null;
    this.panNote = selectedPan? selectedPan[1] : '';
    if (this.panIdsString !== panIdsString) {
      this.panIdsString = panIdsString;
      this.router.navigate([], { queryParams: {pan}, queryParamsHandling: 'merge', replaceUrl: true});
    }
  }

  goBack(): void {
    this.navService.back();
  }
}
