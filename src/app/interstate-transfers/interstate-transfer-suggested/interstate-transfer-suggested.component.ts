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
    this.shared.getBranch().subscribe(_ => this._ownState = _);
  }

  private sendIttEmail(fromState: string | null, toState: string, lines: any[], docId: string): void {
    const subject = `Items requested by ${toState}`;
    const rows = lines.map(_ => `<tr><td>${_.itemNumber}</td><td>${_.toTransfer}</td></tr>`).join('');
    const body = `<p><strong>Order no.:</strong> <a href="${environment.redirectUri}/transfers/active/${docId}">${docId}</a></p><table><tr><th>Item number</th><th>Qty Requested</th></tr>${rows}</table>`;
    const to = this.shared.emailMap.get(fromState || '') || [];
    if (environment.production) this.shared.sendMail(to, subject, body, 'HTML');
  }

  createTransfer(): void {
    this.creating = true;
    if (!this.activeLines || this.activeLines.length === 0 || !this._ownState || !this.fromState) return;
    const lines = this.activeLines.filter((_: any) => _.toTransfer);
    this.interstateTransfersService.createInTransitTransfer(this.fromState, this._ownState, lines).then(_ => {
      this.snackBar.open('Successfully created ITT.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
      this.router.navigate(['transfers/active', _.docId]);
      this.sendIttEmail(this.fromState, this._ownState, lines, _.docId);
      this.creating = false;
    }).catch(err => {
      this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
      this.creating = false;
      return of();
    })
  }
}
