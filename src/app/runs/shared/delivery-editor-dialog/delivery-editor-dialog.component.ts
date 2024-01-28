import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { throwError } from 'rxjs';

import { Delivery } from '../delivery';
import { DeliveryService } from '../delivery.service';

interface DeliveryForm {
  address: FormControl<string | null>;
  notes: FormControl<string | null>;
  requested: FormControl<Date | null>;
}

@Component({
  selector: 'gcp-delivery-editor-dialog',
  templateUrl: './delivery-editor-dialog.component.html',
  styleUrls: ['./delivery-editor-dialog.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDatepickerModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule]
})
export class DeliveryEditorDialogComponent implements OnInit {
  public loading = false;
  public deliveryForm!: FormGroup<DeliveryForm>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {delivery: Delivery},
    private dialogRef: MatDialogRef<DeliveryEditorDialogComponent>,
    private fb: FormBuilder,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    this.deliveryForm = this.fb.group({
      address: this.data.delivery.fields.Address,
      notes: this.data.delivery.fields.Notes,
      requested: new Date(this.data.delivery.fields.RequestedDate)
    });
  }

  updateDelivery(): void {
    this.loading = true;
    const notes = this.deliveryForm.value.notes || '';
    let requestedDate = this.deliveryForm.value.requested;
    if (requestedDate) {
      requestedDate = new Date(`${requestedDate.getFullYear()}-${requestedDate.getMonth() + 1}-${requestedDate.getDate()}`);
    }
    const action = this.deliveryService.updateDelivery(this.data.delivery.id, notes, requestedDate);
    action.then(() =>
      this.dialogRef.close()
    ).catch(err => {
        this.loading = false;
        return throwError(() => new Error(err));
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}