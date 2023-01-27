import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { combineLatest, map, Observable, startWith, Subject, tap } from 'rxjs';
import { Chemical } from '../chemical';
import { SdsService } from '../sds.service';

@Component({
  selector: 'gcp-sds-backpack-dialog',
  templateUrl: './sds-backpack-dialog.component.html',
  styleUrls: ['./sds-backpack-dialog.component.css']
})
export class SdsBackpackDialogComponent implements OnInit {
  public chemicals$!: Observable<Chemical[]>;
  public saving = false;
  public selected: Chemical | undefined;
  public loading = true;
  public subject = new Subject<boolean>();
  public searchControl = new FormControl('');

  constructor (
    public dialogRef: MatDialogRef<SdsBackpackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {chemical: Chemical},
    private sdsService: SdsService
  ) { }

  ngOnInit(): void {
    const query = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(_ => _?.toLocaleLowerCase())
    )
    this.chemicals$ = combineLatest([this.sdsService.getSyncedChemicals(), query]).pipe(
      map(([a, b]) => b ? a.filter(_ => _['key'].includes(b)) : a),
      tap(() => this.loading = false)
    )

  }

  setItem(e: MatSelectionListChange): void {
    this.selected = e.options[0].value;
  }

  syncFromChemwatch(): void {
    this.loading = true;
    this.sdsService.syncFromChemwatch().then(
      () => this.subject.next(true)
    );
  }

  linkMaterial(): void {
    if (!this.selected?.CwNo) return;
    this.saving = true;
    this.sdsService.linkChemicalToItem(this.data.chemical.ItemNmbr, this.selected.CwNo).then(
      _ =>  this.dialogRef.close()
    ).catch(e => this.saving = false);
  }

  clearSearch(): void {
    this.searchControl.reset();
  }
}
