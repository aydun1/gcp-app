import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';

import { DeliveryService } from '../delivery.service';
import { Run } from '../run';

@Component({
  selector: 'gcp-run-manager-dialog',
  templateUrl: './run-manager-dialog.component.html',
  styleUrls: ['./run-manager-dialog.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule]
})
export class RunManagerDialogComponent {
  public loading = false;
  public runs$!: Observable<Run[]>;
  public runForm = this.fb.group({
    run: ['', [Validators.required, this.deliveryService.uniqueRunValidator(this.data.runs)]],
    owner: ['', []]
  });
  public runId!: string;
  public oldName!: string;
  public oldOwner!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {runs: Array<Run>},
    private dialogRef: MatDialogRef<RunManagerDialogComponent>,
    private fb: FormBuilder,
    private router: Router,
    private deliveryService: DeliveryService
  ) { }

  openEditor(runId: string, name: string, owner: string): void {
    this.runId = runId;
    this.oldName = name;
    this.oldOwner = owner;
    this.runForm = this.fb.group({
      run: [name, [Validators.required, this.deliveryService.uniqueRunValidator(this.data.runs.filter(_ => _.fields.Title !== this.oldName))]],
      owner: [owner, []]
    });
  }

  addRun(): void {
    this.loading = true;
    const runName = this.runForm.value['run'];
    const runOwner = this.runForm.value['owner'] || '';
    if (this.runForm.invalid || !runName) return;
    this.deliveryService.addRun(runName, runOwner).subscribe(_ => {
      this.closeDialog(runName);
    });
  }

  renameRun(): void {
    this.loading = true;
    const newName = this.runForm.value['run'];
    const owner = this.runForm.value['owner'] || '';
    if (this.runForm.invalid || !newName) return;
    this.deliveryService.renameRun(this.runId, newName, this.oldName, owner).subscribe(_ => {
      this.closeDialog(newName);
    });
  }

  deleteRun(): void {
    this.loading = true;
    this.deliveryService.deleteRun(this.runId, this.oldName).subscribe(() => {
      this.loading = false;
      this.closeDialog(null);
    });
  }

  navigate(run: string | null): void {
    this.router.navigate([], { queryParams: {run}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  closeDialog(run: string | null): void {
    this.dialogRef.close(run);
  }
}