import { Component, Inject, OnInit } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';

import { DeliveryService } from '../delivery.service';
import { Run } from '../run';

interface RunForm {
  run: FormControl<string | null>;
  owner: FormControl<string | null>;
}

@Component({
  selector: 'gcp-run-manager-dialog',
  templateUrl: './run-manager-dialog.component.html',
  styleUrls: ['./run-manager-dialog.component.css'],
  standalone: true,
  imports: [NgForOf, NgIf, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatListModule]
})
export class RunManagerDialogComponent implements OnInit {
  public loading = true;
  public runs$!: Observable<Run[]>;
  public runForm!: FormGroup<RunForm>;
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

  ngOnInit(): void {
    this.loading = false;
    this.runForm = this.fb.group({
      run: ['', [Validators.required, this.deliveryService.uniqueRunValidator(this.data.runs)]],
      owner: ['', []]
    });
  }

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