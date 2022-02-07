import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';

@Component({
  selector: 'gcp-recycling-new',
  templateUrl: './recycling-new.component.html',
  styleUrls: ['./recycling-new.component.css']
})
export class RecyclingNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';
  private assetType = new FormControl('', Validators.required);

  public cageForm: FormGroup;
  public loading: boolean;
  public choices$: BehaviorSubject<any>;

  public get isCage(): boolean {
    return this.assetType.value.startsWith('Cage');
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private navService: NavigationService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.getOptions();

    this.cageForm = this.fb.group({
      assetType: this.assetType,
      cageNumber: [{value:'', disabled: true}, Validators.required, this.recyclingService.uniqueCageValidator(this.assetType)],
      cageWeight: [{value:'', disabled: true}, Validators.required],
      branch: ['', Validators.required]
    });

    this.cageForm.get('assetType').valueChanges.subscribe(val => {
      const cageNumber = this.cageForm.get('cageNumber');
      const cageWeight = this.cageForm.get('cageWeight');
      val.startsWith('Cage') ? cageNumber.enable() : cageNumber.disable();
      val.startsWith('Cage') ? cageWeight.enable() : cageWeight.disable();
    });
  }

  getOptions(): void {
    this.choices$ = this.recyclingService.getColumns();
  }

  addCage(): void {
    if (this.cageForm.invalid) return;
    const d = this.cageForm.value;
    this.loading = true;
    this.recyclingService.addNewCage(d.cageNumber, d.branch, d.assetType, d.cageWeight).pipe(
      tap(_ => {
        this.router.navigate(['recycling/cages', _.id], {replaceUrl: true});
        this.snackBar.open('Cage added', '', {duration: 3000});
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe(_ => console.log(_));
  }

  goBack(): void {
    this.navService.back();
  }
}
