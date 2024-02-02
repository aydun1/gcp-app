import { Component, Inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';

import { SharedService } from '../../../shared.service';
import { RecyclingService } from '../../shared/recycling.service';
import { Cage } from '../../shared/cage';
import { Customer } from '../../../customers/shared/customer';
import { Site } from '../../../customers/shared/site';
import { ActionButtonComponent } from '../action-button/action-button.component';
import { CageNotesComponent } from '../cage-notes/cage-notes.component';
import { CageMaterialComponent } from '../cage-material/cage-material.component';
import { CageWeightsComponent } from '../cage-weights/cage-weights.component';
import { CageDetailsComponent } from '../cage-details/cage-details.component';
import { GroupCagesPipe } from '../../../shared/pipes/group-cages';

interface AllocatorForm {
  site: FormControl<string | null>;
}

interface CollectorForm {
  site: FormControl<string | null>;
  cageWeight: FormControl<number | null>;
  grossWeight: FormControl<string | null>;
  material: FormControl<string | null>;
}

@Component({
  selector: 'gcp-recycling-dialog',
  templateUrl: './recycling-dialog.component.html',
  styleUrls: ['./recycling-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatExpansionModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatSelectModule, MatSlideToggleModule, ActionButtonComponent, CageDetailsComponent, CageNotesComponent, CageMaterialComponent, CageWeightsComponent, GroupCagesPipe]
})
export class RecyclingDialogComponent implements OnInit {
  readonly allocated = 1;
  readonly delivered = 2;
  readonly returned = 3;
  public others = ['Bulka Bag', 'Pallet', 'Other'];
  public noAllocatedCages$ = new BehaviorSubject<boolean>(false);
  public noDeliveredCages$ = new BehaviorSubject<boolean>(false);
  public noReturnedCages$ = new BehaviorSubject<boolean>(false);
  public cages$ = new BehaviorSubject<Cage[]>([]);
  public allocatorForm!: FormGroup<AllocatorForm>;
  public collectorForm!: FormGroup<CollectorForm>;
  public assigning!: boolean;
  public collecting!: boolean;
  public availableCages$!: Observable<Cage[]>;
  public loadingCages$ = new BehaviorSubject<boolean>(true);
  public loadingAvailableCages$ = new BehaviorSubject<boolean>(true);
  public sites!: Array<string>;
  public site!: string | undefined;
  public get branches(): Array<string> {return this.shared.branches}
  public materialTypes = this.recyclingService.materials;
  public sending = false;

  constructor(
      public dialogRef: MatDialogRef<RecyclingDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {customer: Customer, sites: Array<Site>, site: string, branch: string},
      private router: Router,
      private snackBar: MatSnackBar,
      private shared: SharedService,
      private recyclingService: RecyclingService,
      private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const requireSite = this.data.site || this.data.sites?.length > 0;
    this.site = this.data.site;
    this.sites = this.data.sites ? this.data.sites.map(_ => _.fields.Title) : [this.site].filter(_ => _);
    this.allocatorForm = this.fb.group({
      site: new FormControl(this.site, requireSite ? [Validators.required] : [])
    });
    this.collectorForm = this.fb.group({
      site: new FormControl(this.site, requireSite ? [Validators.required] : []),
      cageWeight: new FormControl(30, [Validators.required]),
      grossWeight: new FormControl('', [Validators.required]),
      material: new FormControl('', []),
    });
    this.getCagesWithCustomer();
    this.getAvailableCages(false);
  }

  getCagesWithCustomer(): void {
    this.loadingCages$.next(true);
    this.recyclingService.getActiveCustomerCages(this.data.customer.custNmbr, this.site, true).pipe(
      map(_ => _.map(c => {
        return {...c, logo: this.recyclingService.materials.find(m => m['code'] === c.fields.Material)?.image}
      }))
    ).subscribe(
      _ => {
        this.noAllocatedCages$.next(_.filter(c => c['statusId'] === this.allocated).length === 0);
        this.noDeliveredCages$.next(_.filter(c => c['statusId'] === this.delivered).length === 0);
        this.noReturnedCages$.next(_.filter(c => c['statusId'] && c['statusId'] >= this.returned).length === 0);
        this.cages$.next(_);
        this.loadingCages$.next(false);
      }
    );
  }

  createAndAssignToCustomer(containerType: string): void {
    if (this.allocatorForm.invalid) return;
    this.sending = true;
    const site = this.allocatorForm.value.site;
    this.recyclingService.addNewCage(undefined, this.data.branch, containerType, undefined).pipe(
      switchMap(_ => this.recyclingService.allocateToCustomer(_.id, this.data.customer.custNmbr, this.data.customer.name, site))
    ).subscribe(() => {
      this.backToMain();
      this.snackBar.open('Assigned to customer', '', {duration: 3000});
      this.sending = false;
    });
  }

  assignToCustomer(id: string): void {
    if (this.allocatorForm.invalid) return;
    this.sending = true;
    const site = this.allocatorForm.value.site;
    this.recyclingService.allocateToCustomer(id, this.data.customer.custNmbr, this.data.customer.name, site).subscribe(() => {
      this.backToMain();
      this.snackBar.open('Cage assigned to customer', '', {duration: 3000});
      this.sending = false;
    });
  }

  getAvailableCages(all: boolean): void {
    this.loadingAvailableCages$.next(true);
    this.availableCages$ = this.recyclingService.getAvailableCages(all ? '' : this.data.branch).pipe(
      tap(_ => this.loadingAvailableCages$.next(false))
    );
  }

  collectLooseFromCustomer(): void {
    if (!this.collectorForm.valid) return;
    this.sending = true;
    const fields: Partial<Cage['fields']> = {
      Customer: this.data.customer.name,
      CustomerNumber: this.data.customer.custNmbr,
      Branch: this.data.branch,
      GrossWeight: +(this.collectorForm.get('grossWeight')?.value || 0),
      CageWeight: +(this.collectorForm.get('cageWeight')?.value || 0)
    }
    if (this.collectorForm.get('material')?.value) fields['Material'] = +(this.collectorForm.get('material')?.value || 0);
    if (this.collectorForm.get('site')?.value) fields['Site'] = this.collectorForm.get('site')?.value;
    this.recyclingService.collectLooseFromCustomer(fields).subscribe(() => {
      this.backToMain();
      this.snackBar.open('Material collected from customer', '', {duration: 3000});
      this.sending = false;
    });
  }

  openAssigningPage(): void {
    this.assigning = true;
    this.noAllocatedCages$.next(false);
    this.noDeliveredCages$.next(false);
    this.noReturnedCages$.next(false);
  }

  backToMain(): void {
    this.assigning = false;
    this.collecting = false;
    this.loadingAvailableCages$.next(true);
    this.getCagesWithCustomer();
  }

  openCollectingPage(): void {
    this.collecting = true;
    this.noAllocatedCages$.next(false);
    this.noDeliveredCages$.next(false);
    this.noReturnedCages$.next(false);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  setSite(site: string): void {
    this.site = site;
    this.getCagesWithCustomer();
    this.allocatorForm.patchValue({site});
    if(this.data.sites) this.router.navigate([], { queryParams: {site: this.site}, queryParamsHandling: 'merge', replaceUrl: true});
  }
}
