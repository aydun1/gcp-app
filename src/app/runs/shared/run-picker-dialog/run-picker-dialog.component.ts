import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, switchMap, tap } from 'rxjs';

import { SharedService } from '../../../shared.service';
import { DeliveryService } from '../delivery.service';
import { Run } from '../run';

@Component({
  selector: 'gcp-run-picker-dialog',
  templateUrl: './run-picker-dialog.component.html',
  styleUrls: ['./run-picker-dialog.component.css']
})
export class RunPickerDialogComponent implements OnInit {
  public loading = true;
  public runs$!: Observable<Run[] | null>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {custNmbr: string, site: string, message: string},
    private dialogRef: MatDialogRef<RunPickerDialogComponent>,
    private shared: SharedService,
    private deliveryService: DeliveryService,
  ) { }

  ngOnInit(): void {
    this.runs$ = this.shared.getBranch().pipe(
      switchMap(branch => this.deliveryService.getRuns(branch)),
      tap(_ => this.loading = false)
    )
  }

  pickRun(run: string): void {
    if (this.data) {
      this.deliveryService.requestCageTransfer(run, this.data.custNmbr, this.data.site, this.data.message).subscribe(_ => {
        this.closeDialog(run);
      })
    } else {
      this.closeDialog(run);
    }



  }

  closeDialog(run?: string): void {
    this.dialogRef.close(run);
  }
}