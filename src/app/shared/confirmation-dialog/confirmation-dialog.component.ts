import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DialogData {
  title: string;
  content: Array<string>;
  affirm: boolean;
}

@Component({
  selector: 'gcp-confirmation-dialog',
  templateUrl: 'confirmation-dialog.component.html',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule]
})
export class ConfirmationDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}
}