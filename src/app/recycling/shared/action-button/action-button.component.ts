import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, switchMap } from 'rxjs';

import { RecyclingService } from '../recycling.service';
import { Cage } from '../cage';
import { CustomerPickerDialogComponent } from '../../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';
import { NavigationService } from '../../../navigation.service';

@Component({
  selector: 'gcp-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css']
})
export class ActionButtonComponent implements OnInit {

  @Input() cage!: Cage;
  @Output() updated = new EventEmitter<boolean>();

  public loading!: boolean;
  public weightForm!: FormGroup;
  public dialogRef!: MatDialogRef<CustomerPickerDialogComponent, any>;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private navService: NavigationService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.weightForm = this.fb.group({
      weight: ['', Validators.required]
    });
  }

  markWithCustomer(id: string): void {
    this.loading = true;
    this.recyclingService.deliverToCustomer(id).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  markAsCollected(id: string): void {
    this.loading = true;
    this.recyclingService.collectFromCustomer(id).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  markWithPolymer(id: string): void {
    this.loading = true;
    this.recyclingService.deliverToPolymer(id).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  markWithProcessing(id: string): void {
    this.loading = true;
    this.recyclingService.deliverToProcessing(id).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  collectFromProcessing(id: string, assetType: string): void {
    this.loading = true;
    const action = assetType.startsWith('Cage') ? this.recyclingService.collectFromProcessing(id): this.recyclingService.collectAndComplete(id);
    action.subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  collectFromPolymer(id: string, assetType: string): void {
    this.loading = true;
    const action = assetType.startsWith('Cage') ? this.recyclingService.collectFromPolymer(id): this.recyclingService.collectAndComplete(id);
    action.subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  markAvailable(id: string, cageNumber: number, branch: string, assetType: string, cageWeight: number): void {
    this.loading = true;
    this.recyclingService.markCageAvailable(id, cageNumber, branch, assetType, cageWeight).subscribe(_ => {
      if (this.router.url.startsWith('/recycling')) this.router.navigate(['recycling/cages', _[1]['id']], {replaceUrl: true});
      this.loading = false;
      this.updated.next(true);
    });
  }

  dehire(id: string): void {
    this.loading = true;
    this.recyclingService.dehireCage(id).subscribe(_ => {
      this.navService.back();
      this.loading = false;
    });
  }

  openCustomerPicker(id: string): void {
    this.loading = true;
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px'});
    dialogRef.afterClosed().pipe(
      switchMap(_ => _ ? this.recyclingService.allocateToCustomer(id, _.customer.accountnumber, _.customer.name, _.site) : of(1)),
    ).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  saveWeight(id: string): void {
    this.loading = true;
    if (this.weightForm.invalid) return;
    const netWeight = this.weightForm.value.weight - this.cage.fields.CageWeight;
    this.recyclingService.setGrossWeight(id, netWeight).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  undo(id: string, status: string): void {
    console.log(id, status)
    this.loading = true;
    this.recyclingService.undo(id, status).subscribe(_ => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  reset(id: string): void {
    this.loading = true;
    this.recyclingService.resetCage(id).subscribe(_ => {
      this.loading = false;
      this.updated.next(true);
    });
  }
}
