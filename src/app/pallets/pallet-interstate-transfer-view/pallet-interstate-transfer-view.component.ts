import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  public files$: Observable<any>;
  public loading: boolean;
  public editQuantity: boolean;
  public loscamQuantity: number;
  public chepQuantity: number;
  public plainQuantity: number;
  public sender: boolean;
  public receiver: boolean;
  public transport: boolean;

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
        this.loscamQuantity = transfer.summary.loscam;
        this.chepQuantity = transfer.summary.chep;
        this.plainQuantity = transfer.summary.plain;
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
    this.palletsService.editInterstatePalletTransferQuantity(id, this.loscamQuantity, this.chepQuantity, this.plainQuantity).pipe(
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

  cancelEditQuantity(loscam: number, chep: number, plain: number) {
    this.loscamQuantity = loscam;
    this.chepQuantity = chep;
    this.plainQuantity = plain;
    this.editQuantity = false
  }

  goBack() {
    this.navService.back();
  }
}
