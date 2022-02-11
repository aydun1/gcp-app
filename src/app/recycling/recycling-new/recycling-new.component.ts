import { Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, Observable, of, throwError } from 'rxjs';

import { RecyclingService } from '../shared/recycling.service';
import { NavigationService } from '../../navigation.service';
import { SharedService } from 'src/app/shared.service';
import { Cage } from '../shared/cage';

@Component({
  selector: 'gcp-recycling-new',
  templateUrl: './recycling-new.component.html',
  styleUrls: ['./recycling-new.component.css']
})
export class RecyclingNewComponent implements OnInit {
  @HostBinding('class') class = 'app-component';
  @ViewChild('cageNumberInput') cageNumber: ElementRef;
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

  addCage(): Observable<Cage> {
    if (this.cageForm.invalid) return of();
    const d = this.cageForm.value;
    this.loading = true;
    return this.recyclingService.addNewCage(d.cageNumber, d.branch, d.assetType, d.cageWeight).pipe(
      catchError(err => {
        this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 3000});
        this.loading = false;
        return throwError(() => new Error(err));
      })
    );
  }
  
  save() {
    this.addCage().subscribe( _ => {
      this.router.navigate(['recycling/cages', _.id], {replaceUrl: true});
      this.snackBar.open('Cage added', '', {duration: 3000});
    })
  }

  saveAndReset() {
    this.addCage().subscribe( _ => {
      this.snackBar.open('Cage added', '', {duration: 3000});
      this.cageForm.get('cageNumber').patchValue('');
      this.loading = false;
      this.cageNumber.nativeElement.focus();
    })
  }

  goBack(): void {
    this.navService.back();
  }
}
