import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { combineLatest, tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PalletsService } from '../shared/pallets.service';
import { PalletsReconciliationService } from '../shared/pallets-reconciliation.service';
import { Location } from '@angular/common';

@Component({
  selector: 'gcp-pallet-reconciliation-new',
  host: {class:'app-component'},
  templateUrl: './pallet-reconciliation-new.component.html',
  styleUrls: ['./pallet-reconciliation-new.component.css']
})
export class PalletReconciliationNewComponent implements OnInit {
  public palletRecForm: FormGroup;
  public adjInvBalance = 0;
  public adjPhyBalance = 0;
  public stocktakeResult = 0;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public states = this.sharedService.branches;
  public state: string;

  constructor(
    private fb: FormBuilder,
    private location: Location,
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
      branch: [{value: this.state, disabled: true}, [Validators.required]],
      name: [name, [Validators.required]],
      type: ['', [Validators.required]],
      invClosing: ['', [Validators.min(0)]],
      invUnTransfersOff: ['', [Validators.min(0)]],
      invUnTransfersOn: ['', [Validators.min(0)]],
      phyOnSite: ['', [Validators.min(0)]],
      phyOffSite: ['', [Validators.min(0)]],
      phyToBeCollected: [{value: '', disabled: true}, [Validators.min(0)]],
      phyToBeRepaid: [{value: '', disabled: true}, [Validators.min(0)]],
      phyInTransitOff: [{value: '', disabled: true}, [Validators.min(0)]],
      phyInTransitOn: [{value: '', disabled: true}, [Validators.min(0)]],
    });

    this.palletRecForm.valueChanges.pipe(
      tap(_ => {
        const v = this.palletRecForm.getRawValue();
        this.adjInvBalance = +v.invClosing - +v.invUnTransfersOff + +v.invUnTransfersOn;
        this.adjPhyBalance = +v.phyOnSite + +v.phyOffSite + +v.phyToBeCollected - +v.phyToBeRepaid + +v.phyInTransitOff - + v.phyInTransitOn;
        this.stocktakeResult = this.adjInvBalance - this.adjPhyBalance;
      })
    ).subscribe();


    this.palletRecForm.get('type').valueChanges.subscribe(
      _ => {
        this.updateTransits(_)
      }
    )
  }

  updateTransits(type: string) {
    const offs = this.palletsService.getInTransitOff(this.state, type);
    const ons = this.palletsService.getInTransitOn(this.state, type);
    const owed = this.palletsService.getOwed(this.state, type);
    combineLatest([offs, ons, owed]).subscribe(([a, b, c]) => {
      const iouKey = c > 0 ? 'phyToBeCollected' : 'phyToBeRepaid';
      this.palletRecForm.patchValue({
        phyInTransitOff: a,
        phyInTransitOn: b,
        [c > 0 ? 'phyToBeCollected' : 'phyToBeRepaid']: Math.abs(c),
        [c > 0 ? 'phyToBeRepaid' : 'phyToBeCollected']: 0
      })





    })
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

  goBack() {
    this.location.back();
  }
}
