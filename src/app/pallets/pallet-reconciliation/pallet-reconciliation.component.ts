import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';

@Component({
  selector: 'app-pallet-reconciliation',
  templateUrl: './pallet-reconciliation.component.html',
  styleUrls: ['./pallet-reconciliation.component.css']
})
export class PalletReconciliationComponent implements OnInit {
  public palletRecForm: FormGroup;
  public adjInvBalance = 0;
  public adjPhyBalance = 0;
  public stocktakeResult = 0;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  constructor(
    private fb: FormBuilder,
    private sharedService: SharedService
  ) { }

  get surplus() {
    return this.stocktakeResult > 0 ? this.stocktakeResult : this.stocktakeResult === 0 ? 0 : null;
  }

  get deficit() {
    return this.stocktakeResult < 0 ? Math.abs(this.stocktakeResult) : this.stocktakeResult === 0 ? 0 : null;
  }

  ngOnInit(): void {
    const name = this.sharedService.getName();
    const date = new Date();
    this.palletRecForm = this.fb.group({
      date: [date, [Validators.required]],
      name: [name, [Validators.required]],
      type: ['', [Validators.required]],
      invClosing: ['', [Validators.min(0)]],
      invUnTransfersOff: ['', [Validators.min(0)]],
      invUnTransfersOn: ['', [Validators.min(0)]],
      phyOnSite: ['', [Validators.min(0)]],
      phyOffSite: ['', [Validators.min(0)]],
      phyToBeCollected: ['', [Validators.min(0)]],
      phyToBeRepaid: ['', [Validators.min(0)]],
      phyInTransit: ['', [Validators.min(0)]],
    });

    this.palletRecForm.valueChanges.pipe(
      tap(_ => {
        this.adjInvBalance = +_.invClosing - +_.invUnTransfersOff + +_.invUnTransfersOn;
        this.adjPhyBalance = +_.phyOnSite + +_.phyOffSite + +_.phyToBeCollected - +_.phyToBeRepaid + +_.phyInTransit;
        this.stocktakeResult = this.adjInvBalance - this.adjPhyBalance;
      })
    ).subscribe();
  }

  addPalletRec() {

  }
}
