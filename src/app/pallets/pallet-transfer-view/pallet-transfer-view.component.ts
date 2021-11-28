import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, catchError, Observable, Subject, switchMap, tap, throwError } from 'rxjs';
import { PalletsService } from '../shared/pallets.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'gcp-pallet-transfer-view',
  host: {class:'app-component'},
  templateUrl: './pallet-transfer-view.component.html',
  styleUrls: ['./pallet-transfer-view.component.css']
})
export class PalletTransferViewComponent implements OnInit {
  private transferSource$: Subject<string>;
  public transfer$: Observable<any>;
  public loading: boolean;
  public editQuantity: boolean;
  public quantity: number;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.transferSource$ = new BehaviorSubject(id);
    this.transfer$ = this.transferSource$.pipe(
      switchMap(_ => this.palletsService.getPalletTransfer(_)),
      tap(_ => this.quantity = _.summary.quantity)
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
