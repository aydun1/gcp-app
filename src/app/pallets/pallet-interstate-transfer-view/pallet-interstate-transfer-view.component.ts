import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, Observable, Subject, switchMap, tap, throwError } from 'rxjs';
import { PalletsService } from '../shared/pallets.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from 'src/app/shared.service';

@Component({
  selector: 'gcp-pallet-interstate-transfer-view',
  host: {class:'app-component'},
  templateUrl: './pallet-interstate-transfer-view.component.html',
  styleUrls: ['./pallet-interstate-transfer-view.component.css']
})
export class PalletInterstateTransferViewComponent implements OnInit {
  private transferSource$: Subject<string>;
  public transfer$: Observable<any>;
  public loading: boolean;
  public editQuantity: boolean;
  public quantity: number;
  public sender: boolean;
  public receiver: boolean;
  public transport: boolean;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.transferSource$ = new BehaviorSubject(id);
    this.transfer$ = this.transferSource$.pipe(
      switchMap(_ => combineLatest([this.palletsService.getInterstatePalletTransfer(_), this.sharedService.getBranch()])),
      tap(([transfer, state]) => {
        this.quantity = transfer.summary.quantity;
        this.sender = transfer.summary.from === state;
        this.receiver = transfer.summary.to === state;
        this.transport = (this.sender || this.receiver) && (transfer.summary.from === 'Transport' || transfer.summary.to === 'Transport');
      }),
      map(_ => _[0])
    );



  }

  getTransfer(id: string) {
    this.transferSource$.next(id);
  }

  approve(id: string) {
    this.loading = true;
    this.palletsService.approveInterstatePalletTransfer(id, true).pipe(
      tap(_ => {
        this.getTransfer(id);
        this.snackBar.open('Approved interstate transfer', '', {duration: 3000});
        this.loading = false;
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  cancel(id: string) {
    this.loading = true;
    this.palletsService.cancelInterstatePalletTransfer(id).pipe(
      tap(_ => {
        this.getTransfer(id);
        this.snackBar.open('Cancelled interstate transfer', '', {duration: 3000});
        this.loading = false;
        this.goBack();
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  transferp(id: string) {
    this.loading = true;
    this.palletsService.transferInterstatePalletTransfer(id).pipe(
      tap(_ => {
        this.getTransfer(id);
        this.snackBar.open('Marked as transferred', '', {duration: 3000});
        this.loading = false;
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  setQuantity(id: string) {
    this.loading = true;
    this.palletsService.editInterstatePalletTransferQuantity(id, this.quantity).pipe(
      tap(() => {
        this.getTransfer(id);
        this.snackBar.open('Updated quantity', '', {duration: 3000});
        this.editQuantity = false;
        this.loading = false;
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe()
  }

  cancelEditQuantity(quantity: number) {
    this.quantity = quantity;
    this.editQuantity = false
  }

  goBack() {
    this.location.back();
  }
}
