import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { tap } from 'rxjs';

import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';


@Component({
  selector: 'gcp-cage-details',
  templateUrl: './cage-details.component.html',
  styleUrls: ['./cage-details.component.css'],
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatListModule]
})
export class CageDetailsComponent {

  @Input() cage!: Cage;

  @Output() updated = new EventEmitter<boolean>();

  constructor(
    private recyclingService: RecyclingService
  ) { }

  removeDepot(): void {
    this.recyclingService.removeDepot(this.cage.id).pipe(
      tap(() => this.updated.next(true))
    ).subscribe();
  }
}
