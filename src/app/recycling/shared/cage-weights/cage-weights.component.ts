import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { tap } from 'rxjs';
import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-cage-weights',
  templateUrl: './cage-weights.component.html',
  styleUrls: ['./cage-weights.component.css']
})
export class CageWeightsComponent implements OnInit {

  @Input() cage: Cage;
  @Output() updated = new EventEmitter<boolean>();

  public editCageWeight: boolean;
  public cageWeight: number;
  public editGrossWeight: boolean;
  public grossWeight: number;

  constructor(
    private recyclingService: RecyclingService
  ) { }

  ngOnInit(): void {
    this.cageWeight = this.cage.fields.CageWeight;
    this.grossWeight = this.cage.fields.GrossWeight;
  }

  setCageWeight() {
    this.recyclingService.setCageWeight(this.cage.id, this.cageWeight).pipe(
      tap(() => {
        this.cage.fields.CageWeight = this.cageWeight;
        this.updated.next(true);
        this.editCageWeight = false;
      })
    ).subscribe()
  }

  setGrossWeight() {
    this.recyclingService.setGrossWeight(this.cage.id, this.grossWeight).pipe(
      tap(() => {
        this.cage.fields.GrossWeight = this.grossWeight;
        this.updated.next(true);
        this.editGrossWeight = false;
      })
    ).subscribe()
  }

  cancelCageWeight() {
    this.cageWeight = this.cage.fields.CageWeight;
    this.editCageWeight = false
  }

  cancelGrossWeight() {
    this.cageWeight = this.cage.fields.CageWeight;
    this.editGrossWeight = false
  }
}
