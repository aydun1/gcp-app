import { Component, HostBinding, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BehaviorSubject, catchError, firstValueFrom, Observable, switchMap, tap, throwError } from 'rxjs';

import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { Choice } from '../../shared/choice';
import { LoadingScheduleService } from '../shared/loading-schedule.service';
import { TransportCompany } from '../shared/transport-company';
import { LoadingPageComponent } from '../../shared/loading/loading-page/loading-page.component';

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
  styleUrls: ['./loading-schedule-new.component.css'],
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, MatAutocompleteModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatDividerModule, MatIconModule, MatInputModule, MatSelectModule, MatToolbarModule, LoadingPageComponent]
})
export class LoadingScheduleNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  public loadingData = new BehaviorSubject<boolean>(false);
  public savingData = false;
  public transportCompanies$!: Observable<TransportCompany[] | null>;
  public loadingScheduleForm!: FormGroup<LoadingScheduleForm>;
  public states = [...this.sharedService.branches, 'International'];
  public state!: string;
  public choices: {TransportCompany: Choice, Driver: Choice, AssetType: Choice, Branch: Choice, Status: Choice} | undefined;
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
          const data = {} as any;
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
        this.snackBar.open(err.error?.error?.message || 'Unknown error', 'ok', {duration: 3000});
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
