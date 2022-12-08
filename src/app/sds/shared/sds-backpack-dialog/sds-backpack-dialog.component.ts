import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

  constructor(
    public dialogRef: MatDialogRef<SdsBackpackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {itemNumber: string},
    private sdsService: SdsService
  ) { }

  ngOnInit(): void {
    this.getSynced();
  }

  syncFromChemwatch(): void {
    this.sdsService.syncFromChemwatch();
  }

  getSynced(): void {
    this.chemicals$ = this.sdsService.getSyncedChemicals();
  }

  linkMaterial(cwNo: string): void {
    this.saving = true;
    this.sdsService.linkChemicalToItem(this.data.itemNumber, cwNo).then(
      _ =>  this.dialogRef.close()
    ).catch(e => this.saving = false);
  }
}
