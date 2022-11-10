import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';

@Component({
  selector: 'gcp-interstate-transfer-suggested',
  templateUrl: './interstate-transfer-suggested.component.html',
  styleUrls: ['./interstate-transfer-suggested.component.css']
})
export class InterstateTransferSuggestedComponent implements OnInit {
  private _ownState!: string;
  private _states = this.shared.branches;

  public fromState!: string | null;
  public lineCount!: number;
  public activeLines!: Array<any>;
  public creating!: boolean;

  public get otherStates(): Array<string> {
    return this._states.filter(_ => _ !== this._ownState);
  }

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();
    state$.subscribe(_ => this._ownState = _);
  }
  
  createTransfer(): void {
    this.creating = true;
    const id = this.interstateTransfersService.createId(this._ownState);
    if (!this.activeLines || this.activeLines.length === 0 || !this._ownState || !this.fromState) return;
    const lines = this.activeLines.filter((_: any) => _.toTransfer);
    const subject = `Items requested by ${this._ownState}`;
    const rows = lines.map(_ => `<tr><td>${_.itemNumber}</td><td>${_.toTransfer}</td></tr>`).join('');
    const body = `<p><strong>Order no.:</strong> <a href="${environment.redirectUri}/transfers/active/${id}">${id}</a></p><table><tr><th>Item number</th><th>Qty Requested</th></tr>${rows}</table>`;
    const to = this.shared.emailMap.get(this.fromState || '') || [];
    this.interstateTransfersService.createInTransitTransfer(this.fromState, this._ownState, lines, id).then(_ => {
      this.snackBar.open('Successfully created ITT.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
      this.router.navigate(['transfers/active', id]);
      this.creating = false;
      this.shared.sendMail(to, subject, body, 'HTML');
    }).catch(err => {
      this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
      this.creating = false;
      return of();
    })
  }
}
