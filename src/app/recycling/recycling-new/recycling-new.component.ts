import { Component, HostBinding, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';
import { SharedService } from 'src/app/shared.service';

@Component({
  selector: 'gcp-recycling-new',
  templateUrl: './recycling-new.component.html',
  styleUrls: ['./recycling-new.component.css']
})
export class RecyclingNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';
  private state: string;
  private assetType = new FormControl('', Validators.required);
  private defaultWeights = {
    'Cage - Folding (2.5m³)': '190',
    'Cage - Solid (2.5m³)': '170'
  };
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
    private shared: SharedService,
    private navService: NavigationService,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.getOptions();

    this.shared.getBranch().subscribe(state => {
      this.state = state;
      if (this.cageForm) this.cageForm.patchValue({branch: state});
    });

    this.cageForm = this.fb.group({
      assetType: this.assetType,
      cageNumber: [{value:'', disabled: true}, Validators.required, this.recyclingService.uniqueCageValidator(this.assetType)],
      cageWeight: [{value:'', disabled: true}, Validators.required],
      branch: [{value: this.state, disabled: false}, Validators.required]
    });

    this.cageForm.get('assetType').valueChanges.subscribe(val => {
      // Require cage number and weight if asset is a cage
      const cageNumberControl = this.cageForm.get('cageNumber');
      const cageWeightControl = this.cageForm.get('cageWeight');
      val.startsWith('Cage') ? cageNumberControl.enable() : cageNumberControl.disable();
      val.startsWith('Cage') ? cageWeightControl.enable() : cageWeightControl.disable();

      // Set default cage weights
      const cageWeight = this.defaultWeights[val];
      this.cageForm.get('cageWeight').patchValue(cageWeight)
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
