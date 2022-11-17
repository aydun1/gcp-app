import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, catchError, firstValueFrom, Observable, switchMap, tap, throwError } from 'rxjs';

import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { TransportCompany } from '../shared/transport-company';

interface choice {choice: {choices: Array<any>}, name: string};

interface LoadingScheduleForm {
  status: FormControl<string | null>;
  loadingDate: FormControl<string | null>;
  arrivalDate: FormControl<string | null>;
  from: FormControl<string | null>;
  to: FormControl<string | null>;
  transportCompany: FormControl<TransportCompany | null>;
  driver: FormControl<string | null>;
  spaces: FormControl<string | null>;
  notes: FormControl<string | null>;
}

@Component({
  selector: 'gcp-loading-schedule-new',
  templateUrl: './loading-schedule-new.component.html',
  styleUrls: ['./loading-schedule-new.component.css']
})
export class LoadingScheduleNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  public loadingData = new BehaviorSubject<boolean>(false);
  public savingData = false;
  public transportCompanies$!: Observable<TransportCompany[] | null>;
  public loadingScheduleForm!: FormGroup<LoadingScheduleForm>;
  public states = this.sharedService.branches;
  public state!: string;
  public choices!: {TransportCompany: choice, Driver: choice, AssetType: choice, Branch: choice, Status: choice};
  public id: string | null = null;

  get targetStates(): Array<string> {
    const from = this.loadingScheduleForm.get('from')?.value;
    const states = this.states.filter(_ => _ !== from);
    return states;
  }

  get fromStates(): Array<string> {
    const to = this.loadingScheduleForm.get('to')?.value;
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
    this.loadingScheduleForm = this.fb.group({
      status: ['', [Validators.required]],
      loadingDate: ['', [Validators.required]],
      arrivalDate: ['', [Validators.required]],
      from: ['VIC', [Validators.required]],
      to: [this.state !== 'VIC' ? this.state : '', [Validators.required]],
      transportCompany: new FormControl(),
      driver: new FormControl(),
      spaces: ['', [Validators.min(0)]],
      notes: new FormControl()
    });

    this.id = this.route.snapshot.paramMap.get('id');

    this.transportCompanies$ = this.sharedService.getBranch().pipe(
      tap(branch => this.state = branch),
      switchMap(state => this.loadingScheduleService.getTransportCompanies(state)),
      tap(transportCompanies => {
        const activeCompany = this.loadingScheduleForm.get('transportCompany')?.value;
        const name = activeCompany as unknown as string;
        const transportCompany = transportCompanies ? transportCompanies.find(t => t.fields.Title === name) || activeCompany : activeCompany;
        this.loadingScheduleForm.patchValue({transportCompany});
      })
    );

    if (this.id) {
      firstValueFrom(this.loadingScheduleService.getLoadingScheduleEntry(this.id)).then(
        _ => {
          const data = {};
          data['status'] = _.fields['Status'];
          data['arrivalDate'] = _.fields['ArrivalDate'];
          data['loadingDate'] = _.fields['LoadingDate'];
          data['destination'] = _.fields['Destination'];
          data['transportCompany'] = _.fields['TransportCompany'];
          data['driver'] = _.fields['Driver'];
          data['spaces'] = _.fields['Spaces'];
          data['notes'] = _.fields['Notes'];
          data['from'] = _.fields['From'];
          data['to'] = _.fields['To'];
          this.loadingScheduleForm.patchValue(data);
          this.loadingData.next(true);
        }
      )
    } else {
      const data = {status: 'Scheduled', from: 'VIC', to: this.state !== 'VIC' ? this.state : ''};
      this.loadingScheduleForm.patchValue(data);
      this.loadingData.next(true);
    }
    this.getOptions();
  }

  onSubmit(): void {
    if (this.loadingScheduleForm.invalid) return;
    this.savingData = true;
    const payload = {...this.loadingScheduleForm.getRawValue()};
    this.loadingScheduleService.createLoadingScheduleEntry(payload, this.id, this.state).pipe(
      tap(_ => {
        this.goBack();
        this.snackBar.open(`${this.id ? 'Updated' : 'Added'} loading schedule entry`, '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.savingData = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  getOptions(): void {
    this.loadingScheduleService.getColumns().pipe(
      tap(_ => this.choices = _)
    ).subscribe();
  }

  displayFn(option: any): string {
    return option?.fields?.Title || option;
  }

  goBack(): void {
    this.navService.back();
  }
}
