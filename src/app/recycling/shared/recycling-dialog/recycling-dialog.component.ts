import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer } from 'src/app/customers/shared/customer';
import { RecyclingService } from 'src/app/recycling/shared/recycling.service';
import { Cage } from '../../../recycling/shared/cage';

@Component({
  selector: 'gcp-recycling-dialog',
  templateUrl: './recycling-dialog.component.html',
  styleUrls: ['./recycling-dialog.component.css']
})
export class RecyclingDialogComponent implements OnInit {
  public loading: boolean;
  public noActiveCages: boolean;
  public noCageHistory: boolean;
  public cages$ = new BehaviorSubject<Cage[]>([]);
  public weightForm: FormGroup;
  public assigning: boolean;
  public availableCages$: Observable<Cage[]>;

  constructor(
      public dialogRef: MatDialogRef<RecyclingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer},
      private recyclingService: RecyclingService,

      private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.weightForm = this.fb.group({
      weight: ['', Validators.required]
    });
    this.getContainers();
    this.availableCages$ = this.recyclingService.getAvailableCages();
  }

  getContainers() {
    return this.recyclingService.getCagesWithCustomer(this.data.customer.accountnumber).subscribe(
      _ => {
        this.noActiveCages = _.filter(c => c['fields']['Status'] !== 'Complete').length === 0;
        this.noCageHistory = _.filter(c => c['fields']['Status'] === 'Complete').length === 0;

        this.cages$.next(_)
      }
    );
  }

  assignToCustomer(id: string) {
    this.recyclingService.assignCageToCustomer(id, this.data.customer.accountnumber, this.data.customer.name).subscribe(() => this.closeAssigningPage());
  }

  closeAssigningPage() {
    this.assigning = false;
    this.getContainers();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  trackByFn(index: number, item: Cage) {
    return item.id;
  }
}
