import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { SharedService } from '../../shared.service';
import { InterstateTransfersService } from '../shared/interstate-transfers.service';
import { SuggestedItem } from '../../pan-list/suggested-item';
import { PanListComponent } from '../../pan-list/pan-list/pan-list.component';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';

interface NewTransferForm {
  fromState: FormControl<string | null>;
  notes: FormControl<string | null>;
}

@Component({
  selector: 'gcp-interstate-transfer-suggested',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './interstate-transfer-suggested.component.html',
  styleUrls: ['./interstate-transfer-suggested.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatInputModule, MatSelectModule, PanListComponent, LetterheadComponent]
})
export class InterstateTransferSuggestedComponent implements OnInit {
  private _ownState!: string;
  private _states = this.shared.branches;

  public lineCount!: number;
  public activeLines!: Array<SuggestedItem>;
  public creating!: boolean;
  public newTransferForm!: FormGroup<NewTransferForm>;

  public get otherStates(): Array<string> {
    return this._states.filter(_ => _ !== this._ownState);
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private interstateTransfersService: InterstateTransfersService
  ) { }

  ngOnInit(): void {
    this.shared.getBranch().subscribe(_ => this._ownState = _);
    this.newTransferForm = this.fb.group({
      fromState: ['', Validators.required],
      notes: [''],
    });
  }

  createTransfer(): void {
    const fromState = this.newTransferForm.value.fromState || '';
    const toState = this._ownState;
    const notes = this.newTransferForm.value.notes || '';
    if (!this.activeLines || this.activeLines.length === 0 || !toState || !this.newTransferForm.valid) return;
    this.creating = true;
    const lines = this.activeLines.filter(_ => _.ToTransfer);
    this.interstateTransfersService.createInTransitTransfer(fromState, toState, lines).then(_ => {
      this.snackBar.open('Successfully created ITT.', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-primary']});
      this.router.navigate(['transfers/active', _.docId]);
      this.interstateTransfersService.sendIttRequestEmail(fromState, toState, lines, _.docId, notes);
      this.creating = false;
    }).catch(err => {
      this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000, panelClass: ['mat-toolbar', 'mat-warn']});
      this.creating = false;
      return of();
    })
  }
}
