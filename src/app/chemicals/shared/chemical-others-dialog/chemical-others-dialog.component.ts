import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { Observable, startWith, Subject, switchMap, tap } from 'rxjs';

import { Chemical } from '../chemical';
import { ChemicalService } from '../chemical.service';

@Component({
  selector: 'gcp-chemical-others-dialog',
  templateUrl: './chemical-others-dialog.component.html',
  styleUrls: ['./chemical-others-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FormsModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatInputModule, MatListModule, MatProgressSpinnerModule, MatSelectModule, MatTabsModule]
})
export class ChemicalOthersDialogComponent implements OnInit {
  @ViewChild('tabs') tabGroup!: MatTabGroup;

  public chemicals$!: Observable<Chemical[]>;
  public chemicalCount!: number;
  public saving = false;
  public selected: Chemical | undefined;
  public loading = true;
  public searchControl = new FormControl('');
  public newChemicalForm = this.fb.group({
    itemNmbr: ['', [Validators.required]],
    itemDesc: ['', []],
    containerSize: [null, Validators.required],
    units: ['', [Validators.required]]
  });
  public editQuantity = '';
  public quantity!: number;
  public updater = new Subject<boolean>();

  constructor (
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: {ownBranch: string},
    private chemicalService: ChemicalService
  ) { }

  ngOnInit(): void {
    this.chemicals$ = this.updater.pipe(
      startWith(true),
      switchMap(_ => this.chemicalService.getNonInventoryChemicals(this.data.ownBranch)),
      tap(_ => {
        this.chemicalCount = _.length;
        this.loading = false;
      })
    );
  }

  setItem(e: MatSelectionListChange): void {
    this.selected = e.options[0].value;
  }

  addChemical(): void {
    const v = this.newChemicalForm.value;
    if (!this.newChemicalForm.valid || !v.itemNmbr || !v.itemDesc || !v.containerSize || !v.units) return;
    this.saving = true;
    this.newChemicalForm.disable();
    this.chemicalService.addNonInventoryChemicals(v.itemNmbr, v.itemDesc, v.containerSize, v.units).then(
      _ =>  {
        this.tabGroup.selectedIndex = 0;
        this.newChemicalForm.reset();
        this.newChemicalForm.enable();
        this.saving = false;
      }
    ).catch(e => this.saving = false);
  }

  saveQuantity(itemNmbr: string, quantity: number): void {
    this.chemicalService.updateNonInventoryChemicalQuantity(itemNmbr, quantity, this.data.ownBranch).then(_ => {
      this.editQuantity = '';
      this.updater.next(true)
    });
  }

  cancelEditQuantity(quantity: number): void {
    this.quantity = quantity;
    this.editQuantity = '';
  }
}
