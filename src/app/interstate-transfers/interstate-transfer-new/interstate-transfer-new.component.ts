import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';

@Component({
  selector: 'gcp-interstate-transfer-new',
  templateUrl: './interstate-transfer-new.component.html',
  styleUrls: ['./interstate-transfer-new.component.css']
})
export class InterstateTransferNewComponent implements OnInit {
  private _ownState!: string;
  private _states = this.shared.branches;

  public fromState!: string | null;
  public toState!: string | null;
  public lineCount!: number;
  public activeLines!: Array<any>;
  public creating!: boolean;

  public get allStates(): Array<string> {
    return this._states;
  }

  public get otherStates(): Array<string> {
    return this._states.filter(_ => _ !== this.fromState);
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
    if (!this.activeLines || this.activeLines.length === 0 || !this.toState || !this.fromState) return;
    this.creating = true;
    const id = this.interstateTransfersService.createId(this.toState);
    const mpa = this._ownState === 'HEA';
    const lines = this.activeLines.filter((_: any) => _.toTransfer);
    const subject = `Created ITT for ${this.fromState} to ${this.toState}`;
    const rows = lines.map(_ => `<tr><td>${_.itemNumber}</td><td>${_.toTransfer}</td></tr>`).join('');
    const body = `<p><strong>Order no.:</strong> <a href="${environment.redirectUri}/transfers/active/${id}">${id}</a></p><table><tr><th>Item number</th><th>Qty Requested</th></tr>${rows}</table>`;
    const to = [this.fromState, this.toState].filter(_ => _ !== this._ownState).map(_ => this.shared.emailMap.get(`${_}${mpa ? '_MPA' : ''}` || '')).flat(1).filter(_ => _) as string[];
    this.interstateTransfersService.createInTransitTransfer(this.fromState, this.toState, lines, id).then(_ => {
      this.snackBar.open('Successfully created ITT.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
      this.router.navigate(['transfers']);
      this.creating = false;
      this.shared.sendMail(to, subject, body, 'HTML');
    }).catch(err => {
      this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
      this.creating = false;
      return of();
    })
  }
}
