import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/inventory.service';
import { SuggestedItem } from '../../pan-list/suggested-item';
import { PanListComponent } from '../../pan-list/pan-list/pan-list.component';

@Component({
  selector: 'gcp-interstate-transfer-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './interstate-transfer-new.component.html',
  styleUrls: ['./interstate-transfer-new.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatInputModule, MatSelectModule, PanListComponent]
})
export class InterstateTransferNewComponent implements OnInit {
  private _ownState!: string;
  private _states = this.shared.branches;

  public lineCount!: number;
  public activeLines!: Array<SuggestedItem>;
  public creating!: boolean;
  public newTransferForm = this.fb.group({
    fromState: ['', Validators.required],
    toState: ['', [Validators.required]],
    notes: [''],
  });

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
    private fb: FormBuilder,
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
    const fromState = this.newTransferForm.value.fromState || '';
    const toState = this.newTransferForm.value.toState || '';
    const notes = this.newTransferForm.value.notes || '';
    if (!this.activeLines || this.activeLines.length === 0 || !this.newTransferForm.valid) return;
    this.creating = true;
    const lines = this.activeLines.filter(_ => _.ToTransfer);
    this.interstateTransfersService.createInTransitTransfer(fromState, toState, lines).then(_ => {
      this.snackBar.open('Successfully created ITT.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
      this.router.navigate(['inventory/active', _.docId]);
      this.interstateTransfersService.sendQuickRequestEmail(fromState, toState, this._ownState, lines, _.docId, notes)
      this.creating = false;
    }).catch(err => {
      this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
      this.creating = false;
      return of();
    })
  }
}
