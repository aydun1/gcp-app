import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { RecyclingService } from '../recycling.service';
import { Cage } from '../cage';

@Component({
  selector: 'gcp-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css']
})
export class ActionButtonComponent implements OnInit {

  @Input() cage: Cage;
  @Output() updated = new EventEmitter<boolean>();

  public weightForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.weightForm = this.fb.group({
      weight: ['', Validators.required]
    });
  }

  markWithCustomer(id: string) {
    this.recyclingService.deliverToCustomer(id).subscribe(() => this.updated.next(true));
  }

  markAsCollected(id: string) {
    this.recyclingService.collectFromCustomer(id).subscribe(() => this.updated.next(true));
  }

  markWithPolymer(id: string) {
    this.recyclingService.deliverToPolymer(id).subscribe(() => this.updated.next(true));
  }

  markReturnedEmpty(id: string) {
    this.recyclingService.collectFromPolymer(id).subscribe(() => this.updated.next(true));
  }

  markAvailable(id: string, cageNumber: number, branch: string, assetType: string, cageWeight: number) {
    this.recyclingService.markCageAvailable(id, cageNumber, branch, assetType, cageWeight).subscribe(() => this.updated.next(true));
  }

  saveWeight(id: string) {
    if (this.weightForm.invalid) return;
    const netWeight = this.weightForm.value.weight - this.cage.fields.CageWeight;
    this.recyclingService.setCageWeight(id, netWeight).subscribe(() => this.updated.next(true));
  }
}
