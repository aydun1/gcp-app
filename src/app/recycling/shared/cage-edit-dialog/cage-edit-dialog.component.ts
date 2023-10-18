import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RecyclingService } from '../../shared/recycling.service';
import { Cage } from '../../shared/cage';

interface CollectorForm {
  reference: FormControl<string | null>;
  cageWeight: FormControl<number | null>;
  grossWeight: FormControl<number | null>;
  material: FormControl<number | null>;
}

@Component({
  selector: 'gcp-cage-edit-dialog',
  templateUrl: './cage-edit-dialog.component.html',
  styleUrls: ['./cage-edit-dialog.component.css']
})
export class CageEditDialogComponent implements OnInit {

  public collectorForm!: FormGroup<CollectorForm>;
  public materialTypes = this.recyclingService.materials;
  public sending = false;

  constructor(
      public dialogRef: MatDialogRef<CageEditDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {cages: Cage[]},
      private snackBar: MatSnackBar,
      private recyclingService: RecyclingService,
      private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const cage = this.data.cages[0];
    this.collectorForm = this.fb.group({
      reference: new FormControl(cage.fields.Notes, []),
      cageWeight: new FormControl(cage.fields.CageWeight, []),
      grossWeight: new FormControl(cage.fields.GrossWeight, []),
      material: new FormControl(cage.fields.Material, []),
    });
  }

  updateCage(): void {
    if (!this.collectorForm.valid) return;
    this.sending = true;
    const notes = this.collectorForm.get('reference')?.value || '';
    const cageWeight = +(this.collectorForm.get('cageWeight')?.value || 0);
    const grossWeight = +(this.collectorForm.get('grossWeight')?.value || 0);
    const material = +(this.collectorForm.get('material')?.value || 0);
    this.recyclingService.setCageDetails(this.data.cages[0].id, cageWeight, grossWeight, notes, material).subscribe(() => {
      this.snackBar.open('Updated cage details', '', {duration: 3000});
      this.closeDialog();
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
