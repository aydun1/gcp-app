import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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