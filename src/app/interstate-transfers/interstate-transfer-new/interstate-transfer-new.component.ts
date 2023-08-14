import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';

interface NewTransferForm {
  fromState: FormControl<string | null>;
  toState: FormControl<string | null>;
}

@Component({
  selector: 'gcp-interstate-transfer-new',
  templateUrl: './interstate-transfer-new.component.html',
  styleUrls: ['./interstate-transfer-new.component.css']
})
export class InterstateTransferNewComponent implements OnInit {
  private _ownState!: string;
  private _states = this.shared.branches;

  public lineCount!: number;
  public activeLines!: Array<any>;
  public creating!: boolean;
  public newTransferForm!: FormGroup<NewTransferForm>;

  public get allStates(): Array<string> {
    return this._states;
  }

  public get otherStates(): Array<string> {
    const from = this.newTransferForm.get('fromState')?.value;
    const to = this.newTransferForm.get('toState')?.value;
    if (from === to) this.newTransferForm.patchValue({toState: ''});
    return this._states.filter(_ => _ !== from);
  }

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private fb: FormBuilder,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    const state$ = this.shared.getBranch();
    state$.subscribe(_ => this._ownState = _);
    this.newTransferForm = this.fb.group({
      fromState: ['', Validators.required],
      toState: ['', [Validators.required]]
    });
  }
  
  private sendIttEmail(fromState: string, toState: string, lines: any[], docId: string): void {
    const mpa = this._ownState === 'HEA';
    const subject = `Created ITT for ${fromState} to ${toState}`;
    const rows = lines.map(_ => `<tr><td>${_.itemNumber}</td><td>${_.toTransfer}</td></tr>`).join('');
    const body = `<p><strong>Order no.:</strong> <a href="${environment.redirectUri}/transfers/active/${docId}">${docId}</a></p><table><tr><th>Item number</th><th>Qty Requested</th></tr>${rows}</table>`;
    const to = [fromState, toState].filter(_ => _ !== this._ownState).map(_ => this.shared.emailMap.get(`${_}${mpa ? '_MPA' : ''}` || '')).flat(1).filter(_ => _) as string[];
    const cc = [fromState, toState].filter(_ => _ === this._ownState).map(_ => this.shared.panMap.get(`${_}${mpa ? '_MPA' : ''}` || '')).flat(1).filter(_ => _) as string[];
    if (environment.production) this.shared.sendMail(to, subject, body, 'HTML', cc);
  }

  createTransfer(): void {
    const fromState = this.newTransferForm.value.fromState || '';
    const toState = this.newTransferForm.value.toState || '';
    if (!this.activeLines || this.activeLines.length === 0 || !this.newTransferForm.valid) return;
    this.creating = true;
    const lines = this.activeLines.filter((_: any) => _.toTransfer);
    this.interstateTransfersService.createInTransitTransfer(fromState, toState, lines).then(_ => {
      this.snackBar.open('Successfully created ITT.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
      this.router.navigate(['transfers/active', _.docId]);
      this.sendIttEmail(fromState, toState, lines, _.docId);
      this.creating = false;
    }).catch(err => {
      this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
      this.creating = false;
      return of();
    })
  }
}
