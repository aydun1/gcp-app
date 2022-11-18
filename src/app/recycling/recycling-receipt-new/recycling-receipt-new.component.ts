import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, tap, throwError } from 'rxjs';

import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { RecyclingReceiptsService } from '../shared/recycling-receipts.service';

interface NewReceiptForm {
  date: FormControl<Date | null>;
  branch: FormControl<string | null>;
  weight: FormControl<string | null>;
  reference: FormControl<string | null>;
}

@Component({
  selector: 'gcp-recycling-receipt-new',
  templateUrl: './recycling-receipt-new.component.html',
  styleUrls: ['./recycling-receipt-new.component.css']
})
export class RecyclingReceiptNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  public newReceiptForm!: FormGroup<NewReceiptForm>;
  public loading!: boolean;
  public state!: string;
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
      date: new FormControl({value: date, disabled: false}, [Validators.required]),
      branch: new FormControl({value: this.state, disabled: false}, [Validators.required]),
      weight: new FormControl('', [Validators.required, Validators.min(0)]),
      reference: new FormControl('', [Validators.required])
    });
  }

  onSubmit(): void {
    const branch = this.newReceiptForm.get('branch')?.value;
    const values = this.newReceiptForm.value;
    if (this.newReceiptForm.invalid || !values.reference || !branch || !values.weight || !values.date) return;
    this.loading = true;

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

  goBack(): void {
    this.navService.back();
  }

}
