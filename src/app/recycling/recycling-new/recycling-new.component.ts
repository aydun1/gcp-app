import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';

@Component({
  selector: 'app-recycling-new',
  templateUrl: './recycling-new.component.html',
  styleUrls: ['./recycling-new.component.css']
})
export class RecyclingNewComponent implements OnInit {
  public cageForm: FormGroup;
  public loading: boolean;
  public choices$: Observable<any>;

  constructor(
    private fb: FormBuilder,
    private location: Location,
    private router: Router,
    private snackBar: MatSnackBar,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.getOptions();

    this.cageForm = this.fb.group({
      assetType: ['', Validators.required],
      cageNumber: ['', Validators.required],
      branch: ['', Validators.required]
    });


    this.cageForm.get('assetType').valueChanges.subscribe(val => {
      const cageNumber = this.cageForm.get('cageNumber');
      if (val.startsWith('Cage')) {
        cageNumber.setValidators(Validators.required);
      } else {
        cageNumber.patchValue('');
        cageNumber.clearValidators();
      }
      cageNumber.updateValueAndValidity();
  });

  }

  getOptions(): void {
    this.choices$ = this.recyclingService.getColumns();
  }

  addCage() {
    if (this.cageForm.invalid) return;
    const d = this.cageForm.value;
    this.loading = true;
    this.recyclingService.addNewCage(d.cageNumber, d.branch, d.assetType).pipe(
      tap(_ => {
        this.router.navigate(['recycling', _.id], {replaceUrl: true});
        this.snackBar.open('Cage added', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe(_ => console.log(_));
  }

  goBack() {
    this.location.back();
  }
}
