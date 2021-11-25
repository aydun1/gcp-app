import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { combineLatest, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PalletsService } from '../shared/pallets.service';

@Component({
  selector: 'gcp-pallet-reconciliation',
  templateUrl: './pallet-reconciliation.component.html',
  styleUrls: ['./pallet-reconciliation.component.css']
})
export class PalletReconciliationComponent implements OnInit {
  public palletRecForm: FormGroup;
  public adjInvBalance = 0;
  public adjPhyBalance = 0;
  public stocktakeResult = 0;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public states = this.sharedService.branches;
  public state: string;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private palletsService: PalletsService,
    private sharedService: SharedService
  ) { }

  get surplus() {
    return this.stocktakeResult > 0 ? this.stocktakeResult : this.stocktakeResult === 0 ? 0 : null;
  }

  get deficit() {
    return this.stocktakeResult < 0 ? Math.abs(this.stocktakeResult) : this.stocktakeResult === 0 ? 0 : null;
  }

  ngOnInit(): void {
    this.sharedService.getState().subscribe(state => {
      this.state = state;
      if (this.palletRecForm) this.palletRecForm.patchValue({branch: state});
    });
    const name = this.sharedService.getName();
    const date = new Date();
    this.palletRecForm = this.fb.group({
      date: [date, [Validators.required]],
      branch: [this.state, [Validators.required]],
      name: [name, [Validators.required]],
      type: ['', [Validators.required]],
      invClosing: ['', [Validators.min(0)]],
      invUnTransfersOff: ['', [Validators.min(0)]],
      invUnTransfersOn: ['', [Validators.min(0)]],
      phyOnSite: ['', [Validators.min(0)]],
      phyOffSite: ['', [Validators.min(0)]],
      phyToBeCollected: ['', [Validators.min(0)]],
      phyToBeRepaid: ['', [Validators.min(0)]],
      phyInTransitOff: ['', [Validators.min(0)]],
      phyInTransitOn: ['', [Validators.min(0)]],
    });

    this.palletRecForm.valueChanges.pipe(
      tap(_ => {
        this.adjInvBalance = +_.invClosing - +_.invUnTransfersOff + +_.invUnTransfersOn;
        this.adjPhyBalance = +_.phyOnSite + +_.phyOffSite + +_.phyToBeCollected - +_.phyToBeRepaid + +_.phyInTransitOff - + _.phyInTransitOn;
        this.stocktakeResult = this.adjInvBalance - this.adjPhyBalance;
      })
    ).subscribe();


    this.palletRecForm.get('type').valueChanges.subscribe(
      _ => this.updateTransits(_)
    )
  }

  updateTransits(type: string) {
   const offs = this.palletsService.getInTransitOff(this.state, type);
    const ons = this.palletsService.getInTransitOn(this.state, type);
    combineLatest([offs, ons]).subscribe(([a, b]) => this.palletRecForm.patchValue({phyInTransitOff: a, phyInTransitOn: b}))

  }

  reset() {
    this.palletRecForm.reset();
  }

  submit() {
    if (this.palletRecForm.invalid) return;
    this.snackBar.open('Added pallet stocktake', '', {duration: 3000});
    this.palletRecForm.reset();
  }

  addPalletRec() {

  }
}
