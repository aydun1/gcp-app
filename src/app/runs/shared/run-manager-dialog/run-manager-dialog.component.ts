import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DeliveryService } from '../delivery.service';
import { Run } from '../run';

@Component({
  selector: 'gcp-run-manager-dialog',
  templateUrl: './run-manager-dialog.component.html',
  styleUrls: ['./run-manager-dialog.component.css']
})
export class RunManagerDialogComponent implements OnInit {
  public loading = true;
  public runs$!: Observable<Run[]>;
  public runForm!: FormGroup;
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
      run: ['', [Validators.required, this.deliveryService.uniqueRunValidator(this.data.runs)]],
      address: ['']
    });
  }

  openEditor(runId: string, name: string): void {
    this.runId = runId;
    this.oldName = name;
    this.runForm = this.fb.group({
      run: [name, [Validators.required, this.deliveryService.uniqueRunValidator(this.data.runs.filter(_ => _.fields.Title !== this.oldName))]],
    });
  }

  addRun(): void {
    if (this.runForm.invalid) return;
    this.loading = true;
    const run = this.runForm.value['run'];
    this.deliveryService.addRun(run).subscribe(_ => {
      this.loading = false;
      this.closeDialog();
      this.navigate(run);
    });
  }

  renameRun(): void {
    if (this.runForm.invalid) return;
    const newName = this.runForm.value['run'];
    this.deliveryService.renameRun(this.runId, newName, this.oldName).subscribe(_ => {
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