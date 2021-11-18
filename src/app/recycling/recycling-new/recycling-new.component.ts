import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, map, mergeMap, Observable, of, tap, throwError } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';

@Component({
  selector: 'gcp-recycling-new',
  templateUrl: './recycling-new.component.html',
  styleUrls: ['./recycling-new.component.css']
})
export class RecyclingNewComponent implements OnInit {
  public cageForm: FormGroup;
  public loading: boolean;
  public choices$: Observable<any>;

  public get isCage() {
    return this.cageForm ? this.cageForm.get('assetType').value.startsWith('Cage') : false;
  }

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
      cageNumber: [{value:'', disabled: true}, Validators.required],
      cageWeight: [{value:'', disabled: true}, Validators.required],
      branch: ['', Validators.required]
    });


    this.cageForm.get('assetType').valueChanges.subscribe(val => {
      const cageNumber = this.cageForm.get('cageNumber');
      const cageWeight = this.cageForm.get('cageWeight');

      if (val.startsWith('Cage')) {
        cageNumber.enable();
        cageWeight.enable();
      } else {
        cageNumber.disable();
        cageWeight.disable();
      }
    });

    this.cageForm.get('cageNumber').valueChanges.pipe(
      debounceTime(200),
      mergeMap(_ => _ ? this.recyclingService.checkCageNumber(_) : of(null)),
      tap(_ => {
        const control = this.cageForm.get('cageNumber');
        if (_) {
          control.setErrors({duplicate: true});
        } else {
          if (control.hasError('duplicate')) delete control.errors['duplicate'];
          if (control.errors && Object.keys(control.errors).length === 0) control.setErrors(null);
        }
      })
    ).subscribe();
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
