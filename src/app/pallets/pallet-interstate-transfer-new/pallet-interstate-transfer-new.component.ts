import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, tap, throwError } from 'rxjs';

import { SharedService } from '../../shared.service';
import { PalletsService } from '../shared/pallets.service';

@Component({
  selector: 'gcp-pallet-interstate-transfer-new',
  host: {class:'app-component'},
  templateUrl: './pallet-interstate-transfer-new.component.html',
  styleUrls: ['./pallet-interstate-transfer-new.component.css']
})
export class PalletInterstateTransferNewComponent implements OnInit {
  public palletTransferForm: FormGroup;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public states = this.sharedService.branches;
  public state: string;
  public loading: boolean;
  get targetStates() {
    const states = this.states;
    return states.filter(_ => _ !== this.palletTransferForm.get('from').value);
  }
  get ownState() {
    return this.states.filter(_ => this.state ? _ === this.state : _);
  }
  get fromTrans() {
    return this.palletTransferForm.get('from').value === 'Transport';
  }

  constructor(
    private fb: FormBuilder,
    private location: Location,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private palletService: PalletsService
  ) { }

  ngOnInit(): void {
    const name = this.sharedService.getName();
    const date = new Date();

    this.sharedService.getState().subscribe(state => {
      this.state = state;
      if (this.palletTransferForm) this.palletTransferForm.patchValue({from: state});
    });

    this.palletTransferForm = this.fb.group({
      date: [{value: date, disabled: true}, Validators.required],
      name: [{value: name, disabled: true}, Validators.required],
      from: [this.state, Validators.required],
      to: ['', Validators.required],
      type: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(0)]],
      reference: ['', [Validators.required]]
    });

    this.palletTransferForm.get('from').valueChanges.subscribe(
      fromBranch => {
        const toBranch = this.palletTransferForm.get('to');
        if (fromBranch === toBranch.value) toBranch.patchValue('');
      }
    )
  }

  onSubmit(): void {
    if (this.palletTransferForm.invalid) return;
    this.loading = true;
    const payload = {...this.palletTransferForm.value};
    this.palletService.interstatePalletTransfer(payload).pipe(
      tap(_ => {
        this.location.back();
        this.snackBar.open('Added interstate transfer', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe(_ => console.log(_));
  }

  goBack() {
    this.location.back();
  }
}
