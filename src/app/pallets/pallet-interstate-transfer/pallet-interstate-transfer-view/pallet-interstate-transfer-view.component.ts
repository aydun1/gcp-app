import { Component, HostBinding, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BehaviorSubject, catchError, combineLatest, map, Observable, Subject, switchMap, tap, throwError } from 'rxjs';

import { PalletsService } from '../../shared/pallets.service';
import { SharedService } from '../../../shared.service';
import { NavigationService } from '../../../navigation.service';
import { DocsComponent } from '../../../shared/docs/docs.component';
import { LoadingPageComponent } from '../../../shared/loading/loading-page/loading-page.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'gcp-pallet-interstate-transfer-view',
  templateUrl: './pallet-interstate-transfer-view.component.html',
  styleUrls: ['./pallet-interstate-transfer-view.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, MatButtonModule, MatCardModule, MatIconModule, MatListModule, MatToolbarModule, DocsComponent, LoadingPageComponent]
})
export class PalletInterstateTransferViewComponent implements OnDestroy, OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';

  private transferSource$!: Subject<string | null>;
  public transfer$!: Observable<any>;
  public loading = false;
  public editQuantity!: boolean;
  public transferReference!: string;
  public sender!: boolean;
  public receiver!: boolean;
  public transport!: boolean;
  public loadingPage = new BehaviorSubject<boolean>(true);
  public pallets = this.sharedService.palletDetails;
  public values = this.pallets.reduce((acc, curr) => (acc[curr.key] = 0, acc), {} as any);

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private renderer: Renderer2,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private navService: NavigationService,
    private palletsService: PalletsService,
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    const id = this.route.snapshot.paramMap.get('id');
    this.transferSource$ = new BehaviorSubject(id);
    this.transfer$ = this.transferSource$.pipe(
      switchMap(_ => combineLatest([this.palletsService.getInterstatePalletTransfer(_), this.sharedService.getBranch()])),
      tap(([transfer, state]) => {
        this.loadingPage.next(false);
        this.transferReference = transfer.summary.reference;
        this.pallets.forEach(_ => this.values[_.key] = transfer.summary[_.key]);
        this.sender = transfer.summary.from === state;
        this.receiver = transfer.summary.to === state;
        this.transport = (this.sender || this.receiver) && (transfer.summary.from === 'Transport' || transfer.summary.to === 'Transport');
      }),
      map(_ => _[0]),
      catchError((err: HttpErrorResponse) => this.handleError(err, true))
    );
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'print');
  }

  getTransfer(id: string): void {
    this.transferSource$.next(id);
  }

  approve(id: string): void {
    this.loading = true;
    this.palletsService.approveInterstatePalletTransfer(id, true).pipe(
      tap(_ => {
        this.getTransfer(id);
        this.snackBar.open('Approved interstate transfer', '', {duration: 3000});
        this.loading = false;
      }),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    ).subscribe();
  }

  cancel(id: string): void {

    const data = {title: 'Cancel transfer', content: ['Are you sure you want to cancel this pallet transfer?']};
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {width: '800px', data});
    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result) return;
      this.loading = true;
      this.palletsService.cancelInterstatePalletTransfer(id).pipe(
        tap(_ => {
          this.getTransfer(id);
          this.snackBar.open('Cancelled interstate transfer', '', {duration: 3000});
          this.loading = false;
          this.goBack();
        }),
        catchError((err: HttpErrorResponse) => this.handleError(err))
      ).subscribe();
    });
  }

  transferp(id: string): void {
    this.loading = true;
    this.palletsService.transferInterstatePalletTransfer(id).pipe(
      tap(_ => {
        this.getTransfer(id);
        this.snackBar.open('Marked as transferred', '', {duration: 3000});
        this.loading = false;
      }),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    ).subscribe();
  }

  setQuantity(summary: any): void {
    this.loading = true;
    const sameCounts = this.pallets.every(_ => summary[_.key] === this.values[_.key]);
    const sameRef = summary.reference === this.transferReference;
    if (sameCounts && sameRef) {
      this.snackBar.open('Nothing changed', '', {duration: 3000});
      this.editQuantity = false;
      this.loading = false;
      return;
    }
    const action = sameCounts ? this.palletsService.editInterstatePalletTransferReference(summary.id, this.transferReference) :
    this.palletsService.editInterstatePalletTransferQuantity(summary.id, this.transferReference, this.values);

    action.pipe(
      tap(() => {
        this.getTransfer(summary.id);
        this.snackBar.open('Updated transfer', '', {duration: 3000});
        this.editQuantity = false;
        this.loading = false;
      }),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    ).subscribe()
  }

  cancelEditQuantity(transfer: any): void {
    this.pallets.forEach(_ => this.values[_.key] = transfer[_.key]);
    this.transferReference = transfer.reference;
    this.editQuantity = false
  }

  markFileAttached(id: string, status: boolean) {
    this.palletsService.markFileAttached(id, status).subscribe();
  }

  goBack(): void {
    this.navService.back();
  }

  handleError(err: HttpErrorResponse, redirect = false): Observable<never> {
    const message = err.error?.error?.message || 'Unknown error';
    this.snackBar.open(message, '', {duration: 3000});
    this.loading = false;
    if (redirect) this.navService.back();
    return throwError(() => new Error(message));
  }
}
