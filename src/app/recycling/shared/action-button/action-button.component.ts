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
    this.recyclingService.markCageWithCustomer(id).subscribe(() => this.updated.next(true));
  }

  markAsCollected(id: string) {
    this.recyclingService.markCageAsCollected(id).subscribe(() => this.updated.next(true));
  }

  markWithPolymer(id: string) {
    this.recyclingService.markCageWithPolymer(id).subscribe(() => this.updated.next(true));
  }

  markReturnedEmpty(id: string) {
    this.recyclingService.markCageReturnedEmpty(id).subscribe(() => this.updated.next(true));
  }

  markAvailable(id: string, binNumber: number, branch: string, assetType: string) {
    this.recyclingService.markCageAvailable(id, binNumber, branch, assetType).subscribe(() => this.updated.next(true));
  }

  saveWeight(id: string) {
    if (this.weightForm.invalid) return;
    this.recyclingService.setCageWeight(id, this.weightForm.value.weight).subscribe(() => this.updated.next(true));
  }
}
