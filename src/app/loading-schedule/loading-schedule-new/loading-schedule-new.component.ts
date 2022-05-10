import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { NavigationService } from 'src/app/navigation.service';
import { SharedService } from 'src/app/shared.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { TransportCompany } from '../shared/transport-company';

interface choice {choice: {choices: Array<any>}, name: string};

@Component({
  selector: 'gcp-loading-schedule-new',
  templateUrl: './loading-schedule-new.component.html',
  styleUrls: ['./loading-schedule-new.component.css']
})
export class LoadingScheduleNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';

  public transportCompanies$: Observable<any>;
  public loadingScheduleForm: FormGroup;
  public states = this.sharedService.branches;
  public state: string;
  public loading: boolean;
  public choices: {TransportCompany: choice, Driver: choice, AssetType: choice, Branch: choice, Status: choice};
  public id: string;

  get targetStates(): Array<string> {
    const from = this.loadingScheduleForm.get('from').value;
    const states = this.states.filter(_ => _ !== from);
    return states;
  }

  get fromStates(): Array<string> {
    const to = this.loadingScheduleForm.get('to').value;
    const states = this.states.filter(_ => _ !== to);
    return states;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private navService: NavigationService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.loadingScheduleForm = this.fb.group({
      status: ['', [Validators.required]],
      loadingDate: ['', [Validators.required]],
      arrivalDate: ['', [Validators.required]],
      from: [{value: 'VIC'}, [Validators.required]],
      to: [{value: this.state}, [Validators.required]],
      transportCompany: [''],
      driver: [''],
      spaces: ['', [Validators.min(0)]],
      notes: [''],
    });

    this.id = this.route.snapshot.paramMap.get('id');
    this.transportCompanies$ = this.loadingScheduleService.getTransportCompanies().pipe(
      switchMap(_ => this.patchForm(_)),
      tap(() => this.loading = false)
    );

    this.getOptions();

    this.sharedService.getBranch().subscribe(state => {
      this.state = state;
      if (this.loadingScheduleForm) this.patchForm(null);
    });
  }

  patchForm(transportCompanies: Array<TransportCompany>): Observable<TransportCompany[]> {
    if (!this.id) {
      const data = {status: 'Scheduled', from: 'VIC', to: this.state};
      this.loadingScheduleForm.patchValue(data);
      return of(transportCompanies);
    }
    return this.loadingScheduleService.getLoadingScheduleEntry(this.id).pipe(
      tap(_ => {
        const data = {};
        data['status'] = _.fields['Status'];
        data['arrivalDate'] = _.fields['ArrivalDate'];
        data['loadingDate'] = _.fields['LoadingDate'];
        data['destination'] = _.fields['Destination'];
        data['transportCompany'] = transportCompanies.find(t => t.fields.Title === _.fields['TransportCompany']) || '';
        data['driver'] = _.fields['Driver'];
        data['spaces'] = _.fields['Spaces'];
        data['notes'] = _.fields['Notes'];
        data['from'] = _.fields['From'];
        data['to'] = _.fields['To'];
        this.loadingScheduleForm.patchValue(data);
      }),
      map(() => transportCompanies)
    );
  }

  onSubmit(): void {
    if (this.loadingScheduleForm.invalid) return;
    this.loading = true;
    const payload = {...this.loadingScheduleForm.getRawValue()};
    this.loadingScheduleService.createLoadingScheduleEntry(payload, this.id).pipe(
      tap(_ => {
        this.goBack();
        this.snackBar.open(`${this.id ? 'Updated' : 'Added'} loading schedule entry`, '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();

  }

  getOptions(): void {
    this.loadingScheduleService.getColumns().pipe(
      tap(_ => this.choices = _)
    ).subscribe();
  }

  displayFn(option) {
    return option.fields?.Title || option;
  }

  goBack(): void {
    this.navService.back();
  }
}