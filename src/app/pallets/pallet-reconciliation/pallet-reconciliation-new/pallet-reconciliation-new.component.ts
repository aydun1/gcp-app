import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, lastValueFrom, tap, throwError } from 'rxjs';

import { PalletsService } from '../../shared/pallets.service';
import { PalletsReconciliationService } from '../../shared/pallets-reconciliation.service';
import { SharedService } from '../../../shared.service';
import { NavigationService } from '../../../navigation.service';

interface PalletRecForm {
  date: FormControl<Date | null>;
  branch: FormControl<string | null>;
  name: FormControl<string | null>;
  pallet: FormControl<string | null>;
  currentBalance: FormControl<string | null>;
  onSite: FormControl<string | null>;
  offSite: FormControl<string | null>;
  toBeCollected: FormControl<number | null>;
  toBeRepaid: FormControl<number | null>;
  inTransitOff: FormControl<number | null>;
  inTransitOn: FormControl<number | null>;
}

@Component({
  selector: 'gcp-pallet-reconciliation-new',
  templateUrl: './pallet-reconciliation-new.component.html',
  styleUrls: ['./pallet-reconciliation-new.component.css']
})
export class PalletReconciliationNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  public loadingData = new BehaviorSubject<boolean>(false);
  public palletRecForm!: FormGroup<PalletRecForm>;
  public adjBalance = 0;
  public stocktakeResult = 0;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public states = this.sharedService.branches;
  public state!: string;
  public loading = false;
  public id: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private palletsService: PalletsService,
    private palletsReconciliationService: PalletsReconciliationService,
    private sharedService: SharedService,
    private navService: NavigationService
  ) { }

  get surplus(): number | null {
    return this.stocktakeResult > 0 ? this.stocktakeResult : this.stocktakeResult === 0 ? 0 : null;
  }

  get deficit(): number | null {
    return this.stocktakeResult < 0 ? Math.abs(this.stocktakeResult) : this.stocktakeResult === 0 ? 0 : null;
  }

  ngOnInit(): void {
    const name = this.sharedService.getName();
    const date = new Date();
    this.palletRecForm = this.fb.group({
      date: [date, [Validators.required]],
      branch: new FormControl({value: this.state, disabled: true}, [Validators.required]),
      name: new FormControl({value: name, disabled: true}, [Validators.required]),
      pallet: ['', [Validators.required]],
      currentBalance: ['', [Validators.required, Validators.min(0)]],
      onSite: ['', [Validators.required, Validators.min(0)]],
      offSite: ['', [Validators.required, Validators.min(0)]],
      toBeCollected: new FormControl({value: 0, disabled: true}),
      toBeRepaid: new FormControl({value: 0, disabled: true}),
      inTransitOff: new FormControl({value: 0, disabled: true}),
      inTransitOn: new FormControl({value: 0, disabled: true}),
    });

    this.id = this.route.snapshot.paramMap.get('id');

    if (this.id) {
      lastValueFrom(this.palletsReconciliationService.getReconciliation(this.id)).then(
        _ => {
          const data = {};
          data['date'] = new Date(_.fields['Date'] || _.fields['Created']);
          data['pallet'] = _.fields['Pallet'];
          data['branch'] = _.fields['Branch'];
          data['currentBalance'] = _.fields['CurrentBalance'];
          data['onSite'] = _.fields['OnSite'];
          data['offSite'] = _.fields['OffSite'];
          data['toBeCollected'] = _.fields['ToBeCollected'];
          data['toBeRepaid'] = _.fields['ToBeRepaid'];
          data['inTransitOff'] = _.fields['InTransitOff'];
          data['inTransitOn'] = _.fields['InTransitOn'];
          this.palletRecForm.patchValue(data);
          this.palletRecForm.get('date')?.disable();
          this.palletRecForm.get('pallet')?.disable();
          this.loadingData.next(true);
        }
      )
    } else {
      this.sharedService.getBranch().pipe(
        tap(_ => {
          this.state = _;
          if (this.palletRecForm) this.palletRecForm.patchValue({branch: _});
        })
      ).subscribe();
      this.palletRecForm.get('date')?.valueChanges.subscribe(() => this.updateTransits());
      this.palletRecForm.get('pallet')?.valueChanges.subscribe(() => this.updateTransits());    
      this.loadingData.next(true);
    }

    this.palletRecForm.valueChanges.pipe(
      tap(_ => {
        const v = this.palletRecForm.getRawValue();
        this.adjBalance = +(v.onSite || 0) + +(v.offSite || 0) + +(v.toBeCollected|| 0) - +(v.toBeRepaid || 0) + +(v.inTransitOff || 0) - +(v.inTransitOn || 0);
        this.stocktakeResult = this.adjBalance - +(v.currentBalance || 0);
      })
    ).subscribe();

  }

  updateTransits(): void {
    const date = this.palletRecForm.get('date')?.value;
    const pallet = this.palletRecForm.get('pallet')?.value;
    if (!pallet || !date) return;
    this.loading = true;
    const offs = this.palletsService.getInTransitOff(this.state, pallet);
    const ons = this.palletsService.getInTransitOn(this.state, pallet);
    const owed = this.palletsService.getPalletsOwedToBranch(this.state, pallet, date);
    combineLatest([offs, ons, owed]).subscribe(([a, b, c]) => {
      this.palletRecForm.patchValue({
        inTransitOff: a,
        inTransitOn: b,
        [c > 0 ? 'toBeCollected' : 'toBeRepaid']: Math.abs(c),
        [c > 0 ? 'toBeRepaid' : 'toBeCollected']: 0
      })
      this.loading = false;
    })
  }

  onSubmit(): void {
    if (this.palletRecForm.invalid) return;
    this.loading = true;
    const payload = {...this.palletRecForm.getRawValue(), surplus: this.surplus, deficit: this.deficit, result: this.stocktakeResult};
    const action = this.id ? this.palletsReconciliationService.updateReconciliation(this.id, payload) :
                             this.palletsReconciliationService.addReconciliation(payload);
    action.pipe(
      tap(_ => {
        this.router.navigate(['pallets/stocktake'], {replaceUrl: true});
        this.snackBar.open(`${this.id ? 'Updated' : 'Added'} pallet stocktake`, '', {duration: 3000});
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
