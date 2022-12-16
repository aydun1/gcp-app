import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { Chemical } from '../../chemical';
import { SdsService } from '../../sds.service';

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
  constructor (
    public dialogRef: MatDialogRef<SdsBackpackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {itemNumber: string},
    private sdsService: SdsService
  ) { }

  ngOnInit(): void {
    this.chemicals$ = this.subject.pipe(
      startWith(true),
      switchMap(() => this.sdsService.getSyncedChemicals()),
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
    this.sdsService.linkChemicalToItem(this.data.itemNumber, this.selected.CwNo).then(
      _ =>  this.dialogRef.close()
    ).catch(e => this.saving = false);
  }
}
