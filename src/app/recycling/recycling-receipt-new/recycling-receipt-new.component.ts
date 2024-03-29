import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { catchError, tap, throwError } from 'rxjs';

import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { RecyclingReceiptsService } from '../shared/recycling-receipts.service';

@Component({
  selector: 'gcp-recycling-receipt-new',
  templateUrl: './recycling-receipt-new.component.html',
  styleUrls: ['./recycling-receipt-new.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatDatepickerModule, MatSelectModule, MatToolbarModule]
})
export class RecyclingReceiptNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  public loading!: boolean;
  public states = this.sharedService.branches;
  public state!: string;
  public newReceiptForm = this.fb.group({
    date: [{value: new Date(), disabled: false}, [Validators.required]],
    branch: [{value: this.state, disabled: false}, [Validators.required]],
    weight: ['', [Validators.required, Validators.min(0)]],
    reference: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private navService: NavigationService,
    private receiptsService: RecyclingReceiptsService
  ) { }

  ngOnInit(): void {
    this.sharedService.getBranch().subscribe(state => {
      this.state = state;
      if (this.newReceiptForm) this.newReceiptForm.patchValue({branch: state});
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
