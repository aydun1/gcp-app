import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { tap } from 'rxjs';

import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-cage-weights',
  templateUrl: './cage-weights.component.html',
  styleUrls: ['./cage-weights.component.css'],
  standalone: true,
  imports: [DecimalPipe, NgIf, FormsModule, MatButtonModule, MatIconModule, MatListModule]
})
export class CageWeightsComponent {
  @Input()
  get cage(): Cage { return this._cage; }
  set cage(value: Cage) {
    this.cageWeight = value.fields.CageWeight;
    this.grossWeight = value.fields.GrossWeight;
    this._cage = value;
  }
  private _cage!: Cage;

  @Output() updated = new EventEmitter<boolean>();

  public editCageWeight!: boolean;
  public cageWeight!: number;
  public editGrossWeight!: boolean;
  public grossWeight!: number;

  constructor(
    private recyclingService: RecyclingService
  ) { }

  setCageWeight(): void {
    this.recyclingService.setCageWeight(this.cage.id, this.cageWeight).pipe(
      tap(() => {
        this.cage.fields.CageWeight = this.cageWeight;
        this.updated.next(true);
        this.editCageWeight = false;
      })
    ).subscribe()
  }

  setGrossWeight(): void {
    this.recyclingService.setGrossWeight(this.cage.id, this.grossWeight).pipe(
      tap(() => {
        this.cage.fields.GrossWeight = this.grossWeight;
        this.updated.next(true);
        this.editGrossWeight = false;
      })
    ).subscribe()
  }

  cancelCageWeight(): void {
    this.cageWeight = this.cage.fields.CageWeight;
    this.editCageWeight = false
  }

  cancelGrossWeight(): void {
    this.cageWeight = this.cage.fields.CageWeight;
    this.editGrossWeight = false;
  }
}
