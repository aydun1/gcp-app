import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Cage } from '../cage';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-recycling-dialog',
  templateUrl: './recycling-dialog.component.html',
  styleUrls: ['./recycling-dialog.component.css']
})
export class RecyclingDialogComponent implements OnInit {
  public loading: boolean;
  public cages$: Observable<Cage[]>;
  constructor(
      public dialogRef: MatDialogRef<RecyclingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private customersService: CustomersService
  ) { }

  ngOnInit(): void {
    this.getContainers();
  }

  getContainers() {
    this.cages$ = this.customersService.getCagesWithCustomer(this.data.customer);
  }
}
