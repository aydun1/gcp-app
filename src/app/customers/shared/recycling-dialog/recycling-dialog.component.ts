import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cage } from '../cage';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-recycling-dialog',
  templateUrl: './recycling-dialog.component.html',
  styleUrls: ['./recycling-dialog.component.css']
})
export class RecyclingDialogComponent implements OnInit {
  public loading: boolean;
  public noCages: boolean;
  public cages$ = new BehaviorSubject<Cage[]>([]);
  public weightForm: FormGroup;
  public assigning: boolean;
  public availableCages$: Observable<Cage[]>;

  constructor(
      public dialogRef: MatDialogRef<RecyclingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private customersService: CustomersService,
      private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.weightForm = this.fb.group({
      weight: ['', Validators.required]
    });
    this.getContainers();
    this.availableCages$ = this.customersService.getAvailableCages();
  }

  getContainers() {
    return this.customersService.getCagesWithCustomer(this.data.customer).subscribe(
      _ => {
        this.noCages = _.length === 0;
        this.cages$.next(_)
      }
    );
  }

  markWithCustomer(id: string) {
    this.customersService.markCageWithCustomer(id).subscribe(() => this.getContainers());
  }

  markAsCollected(id: string) {
    this.customersService.markCageAsCollected(id).subscribe(() => this.getContainers());
  }

  markWithPolymer(id: string) {
    this.customersService.markCageWithPolymer(id).subscribe(() => this.getContainers());
  }

  markReturnedEmpty(id: string) {
    this.customersService.markCageReturnedEmpty(id).subscribe(() => this.getContainers());
  }

  markAvailable(id: string, binNumber: number, branch: string, assetType: string) {
    this.customersService.markCageAvailable(id, binNumber, branch, assetType).subscribe(() => this.getContainers());
  }

  assignToCustomer(id: string) {
    this.customersService.assignCageToCustomer(id, this.data.customer).subscribe(() => this.closeAssigningPage());
  }

  saveWeight(id: string) {
    if (this.weightForm.invalid) return;
    this.customersService.setCageWeight(id, this.weightForm.value.weight).subscribe(() => this.getContainers());
  }

  closeAssigningPage() {
    this.assigning = false;
    this.getContainers();
  }

  trackByFn(index: number, item: Cage) {
    return item.id;
  }
}
