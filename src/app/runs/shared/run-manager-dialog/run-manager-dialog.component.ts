import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DeliveryService } from '../delivery.service';
import { Run } from '../run';

interface RunForm {
  run: FormControl<string | null>;
}

@Component({
  selector: 'gcp-run-manager-dialog',
  templateUrl: './run-manager-dialog.component.html',
  styleUrls: ['./run-manager-dialog.component.css']
})
export class RunManagerDialogComponent implements OnInit {
  public loading = true;
  public runs$!: Observable<Run[]>;
  public runForm!: FormGroup<RunForm>;
  public runId!: string;
  public oldName!: string;

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
      run: ['', [Validators.required, this.deliveryService.uniqueRunValidator(this.data.runs)]]
    });
  }

  openEditor(runId: string, name: string): void {
    this.runId = runId;
    this.oldName = name;
    this.runForm = this.fb.group({
      run: [name, [Validators.required, this.deliveryService.uniqueRunValidator(this.data.runs.filter(_ => _.fields.Title !== this.oldName))]]
    });
  }

  addRun(): void {
    this.loading = true;
    const runName = this.runForm.value['run'];
    if (this.runForm.invalid || !runName) return;
    this.deliveryService.addRun(runName).subscribe(_ => {
      this.loading = false;
      this.closeDialog();
      this.navigate(runName);
    });
  }

  renameRun(): void {
    this.loading = true;
    const newName = this.runForm.value['run'];
    if (this.runForm.invalid || !newName) return;
    this.deliveryService.renameRun(this.runId, newName, this.oldName).subscribe(_ => {
      this.loading = false;
      this.closeDialog();
      this.navigate(newName);
    });
  }

  deleteRun(): void {
    this.loading = true;
    this.deliveryService.deleteRun(this.runId, this.oldName).subscribe(() => {
      this.loading = false;
      this.closeDialog();
      this.navigate(null);
    });
  }

  navigate(run: string | null): void {
    this.router.navigate([], { queryParams: {run}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}