import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { NavigationService } from 'src/app/navigation.service';
import { SharedService } from 'src/app/shared.service';
import { LoadingSchedule } from '../shared/loading-schedule';
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
  public choices: {TransportCompany: choice, Driver: choice, AssetType: choice, Branch: choice};
  public id: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private navService: NavigationService,
    private loadingScheduleService: LoadingScheduleService
  ) { }

  ngOnInit(): void {
    this.loadingScheduleForm = this.fb.group({
      loadingDate: ['', [Validators.required]],
      arrivalDate: ['', [Validators.required]],
      destination: [{value: this.state, disabled: true}, [Validators.required]],
      transportCompany: [''],
      driver: [''],
      spaces: ['', [Validators.min(0)]],
      notes: [''],
    });

    this.id = this.route.snapshot.paramMap.get('id');
    this.transportCompanies$ = this.loadingScheduleService.getTransportCompanies().pipe(
      switchMap(_ => this.patchForm(_))
    );

    this.getOptions();

    this.sharedService.getBranch().subscribe(state => {
      this.state = state;
      if (this.loadingScheduleForm) this.loadingScheduleForm.patchValue({destination: state});
    });


  }

  patchForm(transportCompanies: Array<TransportCompany>): Observable<TransportCompany[]> {
    if (!this.id) return of();
    return this.loadingScheduleService.getLoadingScheduleEntry(this.id).pipe(
      tap(_ => {
        const data = {};
        data['arrivalDate'] = _.fields['ArrivalDate'];
        data['loadingDate'] = _.fields['LoadingDate'];
        data['destination'] = _.fields['Destination'];
        data['transportCompany'] = transportCompanies.find(t => t.fields.Title === _.fields['TransportCompany']) || '';
        data['driver'] = _.fields['Driver'];
        data['spaces'] = _.fields['Spaces'];
        data['notes'] = _.fields['Notes'];
        console.log(data)
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
        this.snackBar.open('Added loading schedule entry', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe(_ => console.log(_));

  }

  getOptions(): void {
    this.loadingScheduleService.getColumns().pipe(
      tap(_ => {
        if (!_) return;
        this.choices = _;
      })
    ).subscribe();
  }

  displayFn(option) {
    return option.fields?.Title || option;
  }

  goBack(): void {
    this.navService.back();
  }
}
