import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { catchError, tap, throwError } from 'rxjs';

import { Delivery } from '../delivery';
import { DeliveryService } from '../delivery.service';

interface DeliveryForm {
  address: FormControl<string | null>;
  notes: FormControl<string | null>;
}

@Component({
  selector: 'gcp-delivery-editor-dialog',
  templateUrl: './delivery-editor-dialog.component.html',
  styleUrls: ['./delivery-editor-dialog.component.css']
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
    });
  }

  updateDelivery(): void {
    this.loading = true;
    const notes = this.deliveryForm.value.notes || '';
    const action = this.deliveryService.updateDelivery(this.data.delivery.id, notes)
    action.pipe(
      tap(_ => {
        this.dialogRef.close();
      }),
      catchError(err => {
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}