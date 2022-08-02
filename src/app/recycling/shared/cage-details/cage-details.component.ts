import { Component, EventEmitter, Input, Output } from '@angular/core';
import { tap } from 'rxjs';

import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-cage-details',
  templateUrl: './cage-details.component.html',
  styleUrls: ['./cage-details.component.css']
})
export class CageDetailsComponent {

  @Input() cage!: Cage;

  @Output() updated = new EventEmitter<boolean>();

  constructor(
    private recyclingService: RecyclingService
  ) { }

  removeDepot() {
    this.recyclingService.removeDepot(this.cage.id).pipe(
      tap(() => this.updated.next(true))
    ).subscribe();
  }
}
