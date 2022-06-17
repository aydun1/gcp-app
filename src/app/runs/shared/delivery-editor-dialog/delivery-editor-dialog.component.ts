import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { SharedService } from '../../../shared.service';
import { Delivery } from '../delivery';
import { DeliveryService } from '../delivery.service';

@Component({
  selector: 'gcp-delivery-editor-dialog',
  templateUrl: './delivery-editor-dialog.component.html',
  styleUrls: ['./delivery-editor-dialog.component.css']
})
export class DeliveryEditorDialogComponent implements OnInit {
  public loading = false;
  public deliveryForm!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {delivery: Delivery},
    private dialogRef: MatDialogRef<DeliveryEditorDialogComponent>,
    private fb: FormBuilder,
    private shared: SharedService,
    private deliveryService: DeliveryService
  ) { }

  ngOnInit(): void {
    console.log(this.data.delivery)
    this.deliveryForm = this.fb.group({
      notes: this.data.delivery.fields.Notes,
    });
  }

  updateDelivery(): void {
    this.loading = true;
    const action = this.deliveryService.updateDelivery(this.data.delivery.id, this.deliveryForm.get('notes')?.value)
    action.pipe(
      tap(_ => {
        this.dialogRef.close();
      }),
      catchError(err => {
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe()
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}