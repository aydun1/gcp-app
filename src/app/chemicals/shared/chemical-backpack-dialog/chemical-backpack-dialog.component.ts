import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { combineLatest, distinctUntilChanged, map, Observable, startWith, Subject, tap } from 'rxjs';
import { Chemical } from '../chemical';
import { ChemicalService } from '../chemical.service';

@Component({
  selector: 'gcp-chemical-backpack-dialog',
  templateUrl: './chemical-backpack-dialog.component.html',
  styleUrls: ['./chemical-backpack-dialog.component.css']
})
export class ChemicalBackpackDialogComponent implements OnInit {
  public chemicals$!: Observable<Chemical[]>;
  public saving = false;
  public selected: Chemical | undefined;
  public loading = true;
  public subject = new Subject<boolean>();
  public searchControl = new FormControl('');

  constructor (
    public dialogRef: MatDialogRef<ChemicalBackpackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {chemical: Chemical},
    private chemicalService: ChemicalService
  ) { }

  ngOnInit(): void {
    const query = this.searchControl.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      map(_ => _?.toLocaleLowerCase())
    )
    this.chemicals$ = combineLatest([this.chemicalService.getSyncedChemicals(), query]).pipe(
      map(([a, b]) => b ? a.filter(_ => _['key'].includes(b)) : a),
      tap(() => this.loading = false)
    )

  }

  setItem(e: MatSelectionListChange): void {
    this.selected = e.options[0].value;
  }

  syncFromChemwatch(): void {
    this.loading = true;
    this.searchControl.disable();
    this.chemicalService.syncFromChemwatch().then(
      () => {
        this.searchControl.enable();
        this.loading = false;
        this.subject.next(true);
      }
    ).catch(e => {
      console.log(e);
      this.searchControl.enable();
      this.loading = false;
    });
  }

  linkMaterial(): void {
    if (!this.selected?.CwNo) return;
    this.saving = true;
    this.chemicalService.linkChemicalToItem(this.data.chemical.ItemNmbr, this.selected.CwNo).then(
      _ =>  this.dialogRef.close()
    ).catch(e => this.saving = false);
  }

  clearSearch(): void {
    this.searchControl.reset();
  }
}
