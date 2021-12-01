import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, tap, throwError } from 'rxjs';

import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { RecyclingReceiptsService } from '../shared/recycling-receipts.service';

@Component({
  selector: 'gcp-recycling-receipt-new',
  host: {class:'app-component'},
  templateUrl: './recycling-receipt-new.component.html',
  styleUrls: ['./recycling-receipt-new.component.css']
})
export class RecyclingReceiptNewComponent implements OnInit {
  public newReceiptForm: FormGroup;
  public loading: boolean;
  public state: string;
  public states = this.sharedService.branches;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private navService: NavigationService,
    private receiptsService: RecyclingReceiptsService
  ) { }

  ngOnInit(): void {
    const date = new Date();

    this.sharedService.getBranch().subscribe(state => {
      this.state = state;
      if (this.newReceiptForm) this.newReceiptForm.patchValue({branch: state});
    });

    this.newReceiptForm = this.fb.group({
      date: [{value: date, disabled: false}, Validators.required],
      branch: [{value: this.state, disabled: true}, [Validators.required]],
      weight: ['', [Validators.required, Validators.min(0)]],
      reference: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.newReceiptForm.invalid) return;
    this.loading = true;
    const branch = this.newReceiptForm.get('branch').value;
    const values = this.newReceiptForm.value;
    this.receiptsService.addNewReceipt(values.reference, branch, values.weight, values.date).pipe(
      tap(_ => {
        this.goBack();
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
    this.navService.back();
  }

}
