import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, map, Observable, Subject, switchMap, tap, throwError } from 'rxjs';

import { PalletsService } from '../shared/pallets.service';
import { SharedService } from '../../shared.service';
import { NavigationService } from '../../navigation.service';

@Component({
  selector: 'gcp-pallet-interstate-transfer-view',
  templateUrl: './pallet-interstate-transfer-view.component.html',
  styleUrls: ['./pallet-interstate-transfer-view.component.css']
})
export class PalletInterstateTransferViewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';

  private transferSource$: Subject<string>;
  public transfer$: Observable<any>;
  public loading: boolean;
  public editQuantity: boolean;
  public transferReference: string;
  public loscamQuantity: number;
  public chepQuantity: number;
  public plainQuantity: number;
  public sender: boolean;
  public receiver: boolean;
  public transport: boolean;
  public loadingPage = new BehaviorSubject<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private navService: NavigationService,
    private palletsService: PalletsService,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.transferSource$ = new BehaviorSubject(id);
    this.transfer$ = this.transferSource$.pipe(
      switchMap(_ => combineLatest([this.palletsService.getInterstatePalletTransfer(_), this.sharedService.getBranch()])),
      tap(([transfer, state]) => {
        this.loadingPage.next(false);
        this.transferReference = transfer.summary.reference;
        this.loscamQuantity = transfer.summary.loscam;
        this.chepQuantity = transfer.summary.chep;
        this.plainQuantity = transfer.summary.plain;
        this.sender = transfer.summary.from === state;
        this.receiver = transfer.summary.to === state;
        this.transport = (this.sender || this.receiver) && (transfer.summary.from === 'Transport' || transfer.summary.to === 'Transport');
      }),
      map(_ => _[0]),
      catchError((err: HttpErrorResponse) => this.handleError(err, true))
    );
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

  setQuantity(id: string, referenceOld: string, loscamOld: number, chepOld: number, plainOld: number): void {
    this.loading = true;
    const sameCounts = loscamOld === this.loscamQuantity && chepOld === this.chepQuantity && plainOld === this.plainQuantity;
    const sameRef = referenceOld === this.transferReference;
    if (sameCounts && sameRef) {
      this.snackBar.open('Nothing changed', '', {duration: 3000});
      this.editQuantity = false;
      this.loading = false;
      return;
    }
    const action = sameCounts ? this.palletsService.editInterstatePalletTransferReference(id, this.transferReference) :
    this.palletsService.editInterstatePalletTransferQuantity(id, this.transferReference, this.loscamQuantity, this.chepQuantity, this.plainQuantity);

    action.pipe(
      tap(() => {
        this.getTransfer(id);
        this.snackBar.open('Updated transfer', '', {duration: 3000});
        this.editQuantity = false;
        this.loading = false;
      }),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    ).subscribe()
  }

  cancelEditQuantity(reference: string, loscam: number, chep: number, plain: number): void {
    this.transferReference = reference;
    this.loscamQuantity = loscam;
    this.chepQuantity = chep;
    this.plainQuantity = plain;
    this.editQuantity = false
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
