import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedService } from 'src/app/shared.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PalletsService } from '../shared/pallets.service';

@Component({
  selector: 'gcp-pallet-interstate-transfer',
  templateUrl: './pallet-interstate-transfer.component.html',
  styleUrls: ['./pallet-interstate-transfer.component.css']
})
export class PalletInterstateTransferComponent implements OnInit {
  public palletTransferForm: FormGroup;
  public pallets = ['Loscam', 'Chep', 'Plain'];
  public states = ['NSW', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
  public state: string;
  get targetStates() {
    return this.states.filter(_ => _ !== this.palletTransferForm.get('from').value);
  }

  constructor(
    private fb: FormBuilder,
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
      from: [{value: this.state, disabled: true}, Validators.required],
      to: ['', [Validators.required]],
      type: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(0)]],
      reference: ['', [Validators.required]]
    });

    this.sharedService.getState().subscribe(
      _ => this.palletTransferForm.patchValue({from: _})
    );

  }

  reset(): void {
    const from = this.palletTransferForm.get('from').value;
    const name = this.sharedService.getName();
    const date = new Date();
    this.palletTransferForm.reset({date, name, from});
    this.palletTransferForm.updateValueAndValidity()
  }

  onSubmit(): void {
    if (this.palletTransferForm.invalid) return;
    const from = this.palletTransferForm.get('from').value;
    const payload = {...this.palletTransferForm.value, from};
    this.palletService.interstateTransfer(payload).subscribe(_ => {
        this.snackBar.open('Added pallet transfer', '', {duration: 3000});
        this.reset();
    });
    
  }

}
