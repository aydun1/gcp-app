import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { QrCodeModule } from 'ng-qrcode';
import { Observable, catchError, of, tap } from 'rxjs';

import { DeliveryService } from '../delivery.service';
import { Chemical } from '../../../chemicals/shared/chemical';
import { ChemicalService } from '../../../chemicals/shared/chemical.service';

interface Data {
  branch: string;
  run: string;
}

@Component({
  selector: 'gcp-run-chemicals-dialog',
  templateUrl: './run-chemicals-dialog.component.html',
  styleUrls: ['./run-chemicals-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, RouterModule, MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule, MatProgressSpinnerModule, QrCodeModule]
})
export class RunChemicalsDialogComponent implements OnInit {
  public chemicals$!: Observable<Chemical[] | undefined>;
  public loading = true;
  public share = false;
  public url!: string;

  constructor(
    private renderer: Renderer2,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RunChemicalsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private deliveryService: DeliveryService,
    private chemicalService: ChemicalService,

  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    this.url = this.deliveryService.getRunChemicalsUrl(this.data.run, this.data.branch)
    this.chemicals$ = this.deliveryService.getChemicalsOnRun(this.data.run, this.data.branch).pipe(
      tap(_ => {
        this.loading = false;
      }),
      catchError(_ => {
        this.snackBar.open('Could not load chemicals', '', {duration: 3000});
        this.loading = false;
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

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }
}
