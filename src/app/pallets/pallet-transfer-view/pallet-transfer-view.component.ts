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
  private id: string;
  private transferSource$: Subject<string>;
  public transfer$: Observable<any>;
  public loading: boolean;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.transferSource$ = new BehaviorSubject(this.id);
    this.transfer$ = this.transferSource$.pipe(
      switchMap(_ => this.palletsService.getPalletTransfer(_)),
      tap(_ => console.log(_))
    );
  
  }

  getTransfer() {
    this.transferSource$.next(this.id);
  }

  approve() {
    this.loading = true;
    this.palletsService.approveInterstatePalletTransfer(this.id, true).pipe(
      tap(_ => {
        this.getTransfer();
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

  transferp() {
    this.loading = true;
    this.palletsService.transferInterstatePalletTransfer(this.id).pipe(
      tap(_ => {
        this.getTransfer();
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

  goBack() {
    this.location.back();
  }
}
