import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';
import { Choice } from '../../shared/choice';

@Component({
  selector: 'gcp-recycling-new',
  templateUrl: './recycling-new.component.html',
  styleUrls: ['./recycling-new.component.css'],
  standalone: true,
  imports: [AsyncPipe, RouterModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatSelectModule, MatToolbarModule]
})
export class RecyclingNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component  mat-app-background';
  @ViewChild('cageNumberInput') cageNumber!: ElementRef;
  private defaultWeights = {
    'Cage - Folding (2.5m³)': '190',
    'Cage - Solid (2.5m³)': '170'
  };
  public multi!: number;
  public assetType = new FormControl('', Validators.required);
  public cageForm = this.fb.group({
    assetType: this.assetType,
    cageNumber: ['', Validators.required, this.recyclingService.uniqueCageValidator(this.assetType)],
    cageWeight: ['', Validators.required],
    branch: ['', Validators.required]
  });


  public loading!: boolean;
  public choices$!: BehaviorSubject<{Branch: Choice, AssetType: Choice}>;

  public get isCage(): boolean {
    return this.cageForm.value.assetType?.startsWith('Cage') || false;
  }

  public get duplicateId(): string {
    const errors = this.cageForm.get('cageNumber')?.errors;
    return errors ? errors['id'] : '';
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private navService: NavigationService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.choices$ = this.recyclingService.getColumns();
    this.shared.getBranch().subscribe(branch => this.cageForm.patchValue({branch}));
    this.cageForm.get('assetType')?.valueChanges.subscribe(val => {
      const v = val as 'Cage - Folding (2.5m³)' | 'Cage - Solid (2.5m³)';
      if (!v) return;
      // Require cage number and weight if asset is a cage
      const cageNumberControl = this.cageForm.get('cageNumber');
      const cageWeightControl = this.cageForm.get('cageWeight');
      v.startsWith('Cage') ? cageNumberControl?.enable() : cageNumberControl?.disable();
      v.startsWith('Cage') ? cageWeightControl?.enable() : cageWeightControl?.disable();

      // Set default cage weights
      this.cageForm.get('cageWeight')?.patchValue(this.defaultWeights[v]);
    });
  }

  addCage(): void {
    const d = this.cageForm.value;
    if (this.cageForm.invalid || !d.branch || !d.assetType) {
      this.snackBar.open('Unable to add cage. Double check form values.', '', {duration: 3000});
      return;
    }
    this.loading = true;
    this.recyclingService.addNewCage(d.cageNumber, d.branch, d.assetType, d.cageWeight).pipe(
      tap( _ => {
        this.snackBar.open('Cage added', '', {duration: 3000});
        this.loading = false;
        if (this.multi === 1) {
          this.cageForm.get('cageNumber')?.patchValue('');
          this.cageForm.get('cageNumber')?.setErrors(null);
          this.cageNumber.nativeElement.focus();
        } else {
          this.router.navigate(['recycling/cages', _.id], {replaceUrl: true});
        }
      }),
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    ).subscribe();
  }

  goBack(): void {
    this.navService.back();
  }
}
