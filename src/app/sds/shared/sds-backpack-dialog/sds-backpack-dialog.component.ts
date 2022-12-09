import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { Chemical } from '../../chemical';
import { SdsService } from '../../sds.service';

@Component({
  selector: 'gcp-sds-backpack-dialog',
  templateUrl: './sds-backpack-dialog.component.html',
  styleUrls: ['./sds-backpack-dialog.component.css']
})
export class SdsBackpackDialogComponent implements OnInit {
  public chemicals$!: Promise<Chemical[]>;
  public saving = false;
  public selected: Chemical | undefined;

  constructor (
    public dialogRef: MatDialogRef<SdsBackpackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {itemNumber: string},
    private sdsService: SdsService
  ) { }

  ngOnInit(): void {
    this.getSynced();
  }

  setItem(e: MatSelectionListChange): void {
    this.selected = e.options[0].value;
  }

  syncFromChemwatch(): void {
    this.sdsService.syncFromChemwatch();
  }

  getSynced(): void {
    this.chemicals$ = this.sdsService.getSyncedChemicals();
  }

  linkMaterial(): void {
    if (!this.selected?.CwNo) return;
    this.saving = true;
    this.sdsService.linkChemicalToItem(this.data.itemNumber, this.selected.CwNo).then(
      _ =>  this.dialogRef.close()
    ).catch(e => this.saving = false);
  }
}
