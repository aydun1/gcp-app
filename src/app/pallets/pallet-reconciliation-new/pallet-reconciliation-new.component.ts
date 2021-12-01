import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, combineLatest, tap, throwError } from 'rxjs';

import { PalletsService } from '../shared/pallets.service';
import { PalletsReconciliationService } from '../shared/pallets-reconciliation.service';
import { SharedService } from '../../shared.service';
import { NavigationService } from '../../navigation.service';

@Component({
  selector: 'gcp-pallet-reconciliation-new',
  host: {class:'app-component'},
  templateUrl: './pallet-reconciliation-new.component.html',
  styleUrls: ['./pallet-reconciliation-new.component.css']
})
export class PalletReconciliationNewComponent implements OnInit {
  public palletRecForm: FormGroup;
  public adjBalance = 0;
  public stocktakeResult = 0;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public states = this.sharedService.branches;
  public state: string;
  public loading: boolean;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private palletsService: PalletsService,
    private palletsReconciliationService: PalletsReconciliationService,
    private sharedService: SharedService,
    private navService: NavigationService
  ) { }

  get surplus() {
    return this.stocktakeResult > 0 ? this.stocktakeResult : this.stocktakeResult === 0 ? 0 : null;
  }

  get deficit() {
    return this.stocktakeResult < 0 ? Math.abs(this.stocktakeResult) : this.stocktakeResult === 0 ? 0 : null;
  }

  ngOnInit(): void {
    this.sharedService.getBranch().subscribe(state => {
      this.state = state;
      if (this.palletRecForm) this.palletRecForm.patchValue({branch: state});
    });
    const name = this.sharedService.getName();
    const date = new Date();
    this.palletRecForm = this.fb.group({
      date: [date, [Validators.required]],
      branch: [{value: this.state, disabled: true}, [Validators.required]],
      name: [{value: name, disabled: true}, [Validators.required]],
      pallet: ['', [Validators.required]],
      currentBalance: ['', [Validators.required, Validators.min(0)]],
      onSite: ['', [Validators.required, Validators.min(0)]],
      offSite: ['', [Validators.required, Validators.min(0)]],
      toBeCollected: [{value: '', disabled: true}, [Validators.min(0)]],
      toBeRepaid: [{value: '', disabled: true}, [Validators.min(0)]],
      inTransitOff: [{value: '', disabled: true}, [Validators.min(0)]],
      inTransitOn: [{value: '', disabled: true}, [Validators.min(0)]],
    });

    this.palletRecForm.valueChanges.pipe(
      tap(_ => {
        const v = this.palletRecForm.getRawValue();
        this.adjBalance = +v.onSite + +v.offSite + +v.toBeCollected - +v.toBeRepaid + +v.inTransitOff - + v.inTransitOn;
        this.stocktakeResult = this.adjBalance - +v.currentBalance;
      })
    ).subscribe();


    this.palletRecForm.get('pallet').valueChanges.subscribe(
      _ => {
        this.updateTransits(_)
      }
    )
  }

  updateTransits(pallet: string) {
    this.loading = true;
    const offs = this.palletsService.getInTransitOff(this.state, pallet);
    const ons = this.palletsService.getInTransitOn(this.state, pallet);
    const owed = this.palletsService.getOwed(this.state, pallet);
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
    this.palletsReconciliationService.addReconciliation(payload).pipe(
      tap(_ => {
        this.goBack();
        this.snackBar.open('Added pallet stocktake', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe(_ => console.log(_));
  }

  goBack() {
    this.navService.back();
  }
}
