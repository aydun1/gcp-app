import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RecyclingService } from '../../shared/recycling.service';
import { Cage } from '../../shared/cage';

@Component({
  selector: 'gcp-cage-edit-dialog',
  templateUrl: './cage-edit-dialog.component.html',
  styleUrls: ['./cage-edit-dialog.component.css'],
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule]
})
export class CageEditDialogComponent {
  public cage = this.data.cages[0];
  public collectorForm = this.fb.group({
    reference: [this.cage.fields.Notes, []],
    cageWeight: [this.cage.fields.CageWeight, []],
    grossWeight: [this.cage.fields.GrossWeight, []],
    material: [this.cage.fields.Material, []],
  });
  public materialTypes = this.recyclingService.materials;
  public sending = false;

  constructor(
      public dialogRef: MatDialogRef<CageEditDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {cages: Cage[]},
      private snackBar: MatSnackBar,
      private recyclingService: RecyclingService,
      private fb: FormBuilder
  ) { }

  updateCage(): void {
    if (!this.collectorForm.valid) return;
    this.sending = true;
    const notes = this.collectorForm.get('reference')?.value || '';
    const cageWeight = +(this.collectorForm.get('cageWeight')?.value || 0);
    const grossWeight = +(this.collectorForm.get('grossWeight')?.value || 0);
    const material = +(this.collectorForm.get('material')?.value || 0) || null;
    this.recyclingService.setCageDetails(this.data.cages[0].id, cageWeight, grossWeight, notes, material).subscribe(() => {
      this.snackBar.open('Updated cage details', '', {duration: 3000});
      this.closeDialog();
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
