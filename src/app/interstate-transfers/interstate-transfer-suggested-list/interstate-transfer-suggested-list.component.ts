import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';
import { PurchaseOrderLine } from '../shared/purchase-order-line';

@Component({
  selector: 'gcp-interstate-transfer-suggested-list',
  templateUrl: './interstate-transfer-suggested-list.component.html',
  styleUrls: ['./interstate-transfer-suggested-list.component.css']
})
export class InterstateTransferSuggestedListComponent implements OnInit {
  public fromBranchFilter = new FormControl({value: '', disabled: true});
  public toBranchFilter = new FormControl('');
  public interstateTransfers$!: Observable<FormGroup<any>>;
  public loading = false;
  public creating = false;
  public displayedColumns = [ 'date', 'product', 'available', 'quantity', 'transfer'];
  public totals!: object;
  public states = this.shared.branches;
  public ownState = '';
  public fromState!: string | null;
  public transferForm!: FormGroup;
  public lineCount!: number;
  public activeLines!: Array<any>;

  public get otherStates(): Array<string> {
    return this.states.filter(_ => _ !== this.ownState);
  }

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();
    state$.subscribe(_ => this.ownState = _);
  }
  
  getPurchaseOrders(params: Params): Observable<PurchaseOrderLine[]> {
    const from = params['from'] || '';
    const to = params['to'] || '';
    if (!from || !to) return of([]);
    return this.interstateTransfersService.getInterstateTransfers(from, to);
  }

  createTransfer(): void {
    this.creating = true;
    if (!this.activeLines || this.activeLines.length === 0 || !this.ownState || !this.fromState) return;
    const lines = this.activeLines.filter((_: any) => _.toTransfer);
    const subject = `Items requested by ${this.fromBranchFilter.value}`;
    let body = 'Item number\tQty Requested\r\n'
    body += lines.map(_ => `${_.itemNumber}\t${_.toTransfer}`).join('\r\n')
    const to = this.shared.emailMap.get(this.toBranchFilter.value || '') || [];
    this.interstateTransfersService.createInTransitTransfer(this.fromState, this.ownState, lines).then(_ => {
      this.snackBar.open('Successfully created ITT.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
      this.router.navigate(['..']);
      this.creating = false;
      this.shared.sendMail(to, subject, body, 'Text');
    }).catch(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
        this.creating = false;
        return of();
      })
  }

  getTotalQtyOnHand(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.qtyOnHand, 0);
  }

  getTotalRequestedQty(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.orderQty, 0);
  }

  getTotalRequestedLines(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + 1, 0);
  }

  getTotalToTransfer(lines: Array<any>): number {
    return lines.reduce((acc, cur) => acc + cur.toTransfer, 0);
  }

}
