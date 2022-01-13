import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';

import { RecyclingService } from '../../shared/recycling.service';
import { Cage } from '../../shared/cage';
import { Customer } from '../../../customers/shared/customer';
import { Site } from '../../../customers/shared/site';

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
  public loadingCages$ = new BehaviorSubject<boolean>(true);

  constructor(
      public dialogRef: MatDialogRef<RecyclingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string},
      private recyclingService: RecyclingService,
      private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.weightForm = this.fb.group({
      weight: ['', Validators.required]
    });
    this.getContainers();
    this.availableCages$ = this.recyclingService.getAvailableCages();
  }

  getContainers() {
    this.loadingCages$.next(true);
    return this.recyclingService.getCagesWithCustomer(this.data.customer.accountnumber, this.data.site).subscribe(
      _ => {
        this.noActiveCages = _.filter(c => c['fields']['Status'] !== 'Complete').length === 0;
        this.noCageHistory = _.filter(c => c['fields']['Status'] === 'Complete').length === 0;
        this.cages$.next(_);
        this.loadingCages$.next(false);
      }
    );
  }

  assignToCustomer(id: string) {
    this.recyclingService.allocateToCustomer(id, this.data.customer.accountnumber, this.data.customer.name, this.data.site).subscribe(() => this.closeAssigningPage());
  }

  closeAssigningPage() {
    this.assigning = false;
    this.getContainers();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  trackByIndex(index: number, item: Cage) {
    return index;
  }

  trackByFn(index: number, item: Cage) {
    return item.id;
  }
}
