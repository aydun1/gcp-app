import { Component, OnInit, Inject } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';

import { DeliveryService } from '../delivery.service';
import { Chemical } from '../../../chemicals/shared/chemical';
import { ChemicalService } from '../../../chemicals/shared/chemical.service';

interface Data {
  branch: string;
  run: string;
};

@Component({
  selector: 'gcp-run-chemicals-dialog',
  templateUrl: './run-chemicals-dialog.component.html',
  styleUrls: ['./run-chemicals-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, NgForOf, NgIf, RouterModule, MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule, MatProgressSpinnerModule]
})
export class RunChemicalsDialogComponent implements OnInit {
  public chemicals$!: Observable<Chemical[] | undefined>;
  public loading = true;

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RunChemicalsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private deliveryService: DeliveryService,
    private chemicalService: ChemicalService,

  ) { }

  ngOnInit(): void {
    this.chemicals$ = this.deliveryService.getChemicalsOnRun(this.data.run, this.data.branch).pipe(
      tap(_ => {
        this.loading = false;
      }),
      catchError(_ => {
        this.closeDialog();
        this.snackBar.open('Could not load run', '', {duration: 3000});
        return of(undefined);
      })
    );

  }

  getPdfPath(itemNmbr: string): string {
    return this.chemicalService.pdfPath(itemNmbr);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

}
