import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { RecyclingService } from '../recycling.service';
import { Cage } from '../cage';
import { CustomerPickerDialogComponent } from '../../../customers/shared/customer-picker-dialog/customer-picker-dialog.component';

@Component({
  selector: 'gcp-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css']
})
export class ActionButtonComponent implements OnInit {

  @Input() cage: Cage;
  @Output() updated = new EventEmitter<boolean>();

  public loading: boolean;
  public weightForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
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

  markReturnedEmpty(id: string): void {
    this.loading = true;
    this.recyclingService.collectFromPolymer(id).subscribe(() => {
      this.loading = false;
      this.updated.next(true);
    });
  }

  markAvailable(id: string, cageNumber: number, branch: string, assetType: string, cageWeight: number): void {
    this.loading = true;
    this.recyclingService.markCageAvailable(id, cageNumber, branch, assetType, cageWeight).subscribe(_ => {
      this.router.navigate(['recycling/cages', _[1]['id']], {replaceUrl: true});
      this.loading = false;
    });
  }

  openCustomerPicker(id: string): void {
    this.loading = true;
    const data = {id};
    const dialogRef = this.dialog.open(CustomerPickerDialogComponent, {width: '600px', data});
    dialogRef.afterClosed().subscribe(() => {
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
}
