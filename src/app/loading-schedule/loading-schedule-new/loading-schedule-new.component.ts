import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { NavigationService } from 'src/app/navigation.service';
import { SharedService } from 'src/app/shared.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';

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
    this.id = this.route.snapshot.paramMap.get('id');

    this.sharedService.getBranch().subscribe(state => {
      this.state = state;
      if (this.loadingScheduleForm) this.loadingScheduleForm.patchValue({destination: state});
    });

    this.transportCompanies$ = this.loadingScheduleService.getTransportCompanies();

    const name = this.sharedService.getName();
    this.loadingScheduleForm = this.fb.group({
      LoadingDate: ['', [Validators.required]],
      arrivalDate: ['', [Validators.required]],
      destination: [{value: this.state, disabled: true}, [Validators.required]],
      name: [{value: name, disabled: true}, [Validators.required]],
      transportCompany: [''],
      driver: [''],
      spaces: ['', [Validators.min(0)]],
      notes: [''],
    });
    this.getOptions()
  }

  onSubmit(): void {
    if (this.loadingScheduleForm.invalid) return;
    this.loading = true;
    const payload = {...this.loadingScheduleForm.getRawValue()};
    this.loadingScheduleService.createLoadingScheduleEntry(payload).pipe(
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
    return option.fields?.Title;
  }

  goBack(): void {
    this.navService.back();
  }
}
