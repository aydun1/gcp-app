import { Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';
import { SharedService } from '../../shared.service';

interface CageForm {
  assetType: FormControl<string | null>;
  cageNumber: FormControl<string | null>;
  cageWeight: FormControl<string | null>;
  branch: FormControl<string | null>;
}

@Component({
  selector: 'gcp-recycling-new',
  templateUrl: './recycling-new.component.html',
  styleUrls: ['./recycling-new.component.css']
})
export class RecyclingNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component  mat-app-background';
  @ViewChild('cageNumberInput') cageNumber!: ElementRef;
  private state!: string;
  private defaultWeights = {
    'Cage - Folding (2.5m³)': '190',
    'Cage - Solid (2.5m³)': '170'
  };
  public multi!: number;
  public cageForm!: FormGroup<CageForm>;
  public loading!: boolean;
  public choices$!: BehaviorSubject<any>;

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
    this.getOptions();
    const assetType = new FormControl('', Validators.required);
    this.cageForm = this.fb.group({
      assetType,
      cageNumber: ['', Validators.required, this.recyclingService.uniqueCageValidator(assetType)],
      cageWeight: ['', Validators.required],
      branch: ['', Validators.required]
    });
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

  getOptions(): void {
    this.choices$ = this.recyclingService.getColumns();
  }

  addCage(): void {
    const d = this.cageForm.value;
    if (this.cageForm.invalid || !d.branch || !d.assetType) {
      this.snackBar.open('Unable to add cage. Double check form values.', '', {duration: 3000});
      return;
    };
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
