import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject, switchMap, tap } from 'rxjs';
import { PalletsService } from '../shared/pallets.service';

@Component({
  selector: 'gcp-pallet-transfer-view',
  templateUrl: './pallet-transfer-view.component.html',
  styleUrls: ['./pallet-transfer-view.component.css']
})
export class PalletTransferViewComponent implements OnInit {
  private id: string;
  private transferSource$: Subject<string>;
  public transfer$: Observable<any>;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
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
  
  goBack() {
    this.location.back();
  }
}
