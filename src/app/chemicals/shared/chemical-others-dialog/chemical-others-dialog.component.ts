import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { MatTabGroup } from '@angular/material/tabs';
import { Observable, startWith, Subject, switchMap, tap } from 'rxjs';

import { Chemical } from '../chemical';
import { ChemicalService } from '../chemical.service';

@Component({
  selector: 'gcp-chemical-others-dialog',
  templateUrl: './chemical-others-dialog.component.html',
  styleUrls: ['./chemical-others-dialog.component.css']
})
export class ChemicalOthersDialogComponent implements OnInit {
  @ViewChild('tabs') tabGroup!: MatTabGroup;

  public chemicals$!: Observable<Chemical[]>;
  public chemicalCount!: number;
  public saving = false;
  public selected: Chemical | undefined;
  public loading = true;
  public searchControl = new FormControl('');
  public newChemicalForm!: FormGroup<any>;
  public editQuantity = '';
  public quantity!: number;
  public updater = new Subject<boolean>();

  constructor (
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: {branch: string},
    private chemicalService: ChemicalService
  ) { }

  ngOnInit(): void {
    this.chemicals$ = this.updater.pipe(
      startWith(true),
      switchMap(_ => this.chemicalService.getNonInventoryChemicals(this.data.branch)),
      tap(_ => {
        this.chemicalCount = _.length;
        this.loading = false;
      })
    );



    this.newChemicalForm = this.fb.group({
      itemNmbr: ['', [Validators.required]],
      itemDesc: ['', []],
      containerSize: ['', Validators.required],
      units: ['', [Validators.required]]
    });

  }

  setItem(e: MatSelectionListChange): void {
    this.selected = e.options[0].value;
  }

  addChemical(): void {
    if (!this.newChemicalForm.valid) return;
    const v = this.newChemicalForm.value;
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

  saveQuantity(itemNmbr: string, quantity: number) {
    this.chemicalService.updateNonInventoryChemicalQuantity(itemNmbr, quantity, this.data.branch).then(_ => {
      this.editQuantity = '';
      this.updater.next(true)
    });
  }

  cancelEditQuantity(quantity: number): void {
    this.quantity = quantity;
    this.editQuantity = '';
  }

  trackByFn(index: number, item: Chemical): string {
    return item.ItemNmbr;
  }
}
