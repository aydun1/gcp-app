import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../../shared.service';
import { PalletsService } from '../../shared/pallets.service';
import { Pallet } from '../../shared/pallet';
import { LetterheadComponent } from '../../../shared/letterhead/letterhead.component';
import { LoadingRowComponent } from '../../../shared/loading/loading-row/loading-row.component';

@Component({
  selector: 'gcp-pallet-interstate-transfer-list',
  templateUrl: './pallet-interstate-transfer-list.component.html',
  styleUrls: ['./pallet-interstate-transfer-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatSelectModule, MatTableModule, LetterheadComponent, LoadingRowComponent]
})
export class PalletInterstateTransferListComponent implements OnInit {
  private _loadList!: boolean;
  public pallets$!: Observable<Pallet[]>;
  public fromFilter = new FormControl('');
  public toFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public loading = this.palletsService.loading;
  public total!: number;
  public displayedColumns = ['date', 'reference', 'pallet', 'from', 'to', 'quantity', 'status', 'attachment'];
  public statuses = ['Pending', 'Approved', 'Transferred', 'Cancelled'];
  public states = this.sharedService.branches.concat('Transport');

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private palletsService: PalletsService,
    private sharedService: SharedService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    this.pallets$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      map(_ => {return {..._, type: 'Transfer'}}),
      tap(() => this.total = 0),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : []),
      tap(pallets => this.total = pallets.map(_ => _.fields.Quantity).filter(_ => _).reduce((acc, val) => acc + +val, 0))
    )
  }

  getFirstPage(_: Params): BehaviorSubject<Pallet[]> {
    this.sharedService.getBranch().subscribe();
    return this.palletsService.getFirstPage(_, false);
  }

  getNextPage(): void {
    this.palletsService.getNextPage();
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('from' in params) {
      this.fromFilter.patchValue(params['from']);
    } else {
      this.fromFilter.patchValue('');
    }
    if ('to' in params) {
      this.toFilter.patchValue(params['to']);
    } else {
      this.toFilter.patchValue('');
    }
    if ('status' in params) {
      this.statusFilter.patchValue(params['status']);
    } else {
      this.statusFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameFrom = prev['from'] === curr['from'];
    const sameTo = prev['to'] === curr['to'];
    const sameStatus = prev['status'] === curr['status'];

    return sameFrom && sameTo && sameStatus && this._loadList;
  }

  setFrom(from: MatSelectChange): void {
    this.router.navigate([], { queryParams: {from: from.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setTo(to: MatSelectChange): void {
    this.router.navigate([], { queryParams: {to: to.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setStatus(status: MatSelectChange): void {
    this.router.navigate([], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setAssetType(assetType: MatSelectChange): void {
    this.router.navigate([], { queryParams: {assetType: assetType.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  approve(id: string): void {
    this.palletsService.approveInterstatePalletTransfer(id, true).subscribe();
  }

  trackByFn(index: number, item: Pallet): string {
    return item.id;
  }
}
