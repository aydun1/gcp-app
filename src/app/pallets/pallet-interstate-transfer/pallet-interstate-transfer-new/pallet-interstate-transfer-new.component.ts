import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { catchError, tap, throwError } from 'rxjs';
import { SharedService } from '../../../shared.service';
import { NavigationService } from '../../../navigation.service';
import { PalletsService } from '../../shared/pallets.service';

interface PalletTransferForm {
  date: FormControl<Date | null>;
  name: FormControl<string | null>;
  from: FormControl<string | null>;
  to: FormControl<string | null>;
  reference: FormControl<string | null>;
  loscam: FormControl<number | null>;
  chep: FormControl<number | null>;
  gcp: FormControl<number | null>;
  plain: FormControl<number | null>;
}

@Component({
  selector: 'gcp-pallet-interstate-transfer-new',
  templateUrl: './pallet-interstate-transfer-new.component.html',
  styleUrls: ['./pallet-interstate-transfer-new.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatIconModule, MatInputModule, MatSelectModule, MatToolbarModule]
})
export class PalletInterstateTransferNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  public palletTransferForm!: FormGroup<PalletTransferForm>;
  public states = this.sharedService.branches;
  public state!: string;
  public loading!: boolean;
  public pallets = this.sharedService.palletDetails;
  get targetStates(): Array<string> {
    const from = this.palletTransferForm.get('from')?.value;
    const states = this.states.filter(_ => _ !== from);
    return from === 'Transport' ? [this.state] : states;
  }
  get ownState(): Array<string> {
    return this.states.filter(_ => this.state ? _ === this.state : _);
  }
  get fromTrans(): boolean {
    return this.palletTransferForm.get('from')?.value === 'Transport';
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private navService: NavigationService,
    private palletService: PalletsService
  ) { }

  ngOnInit(): void {
    const name = this.sharedService.getName();
    const date = new Date();

    this.sharedService.getBranch().subscribe(state => {
      this.state = state;
      if (this.palletTransferForm) this.palletTransferForm.patchValue({from: state});
    });

    this.palletTransferForm = this.fb.group<PalletTransferForm>({
      date: new FormControl({value: date, disabled: true}, Validators.required),
      name: new FormControl({value: name, disabled: true}, Validators.required),
      from: new FormControl(this.state, [Validators.required]),
      to: new FormControl('', [Validators.required]),
      reference: new FormControl('', [Validators.required]),
      loscam: new FormControl(null, [Validators.min(0)]),
      chep: new FormControl(null, [Validators.min(0)]),
      gcp: new FormControl(null, [Validators.min(0)]),
      plain: new FormControl(null, [Validators.min(0)]),
    });

    this.palletTransferForm.get('from')?.valueChanges.subscribe(
      fromBranch => {
        const toBranch = this.palletTransferForm.get('to');
        if (fromBranch === toBranch?.value) toBranch?.patchValue('');
        if (fromBranch === 'Transport') toBranch?.patchValue(this.state);
      }
    )
  }

  onSubmit(): void {
    if (this.palletTransferForm.invalid) return;
    this.loading = true;
    const payload = {...this.palletTransferForm.value};
    this.palletService.createInterstatePalletTransfer(payload).pipe(
      tap(_ => {
        this.goBack();
        this.router.navigate(['pallets/transfer', _.id], {replaceUrl: true});

        this.snackBar.open('Added interstate transfer', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe(_ => console.log(_));
  }

  goBack(): void {
    this.navService.back();
  }
}
