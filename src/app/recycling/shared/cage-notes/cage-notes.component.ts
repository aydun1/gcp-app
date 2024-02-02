import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { tap } from 'rxjs';

import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-cage-notes',
  templateUrl: './cage-notes.component.html',
  styleUrls: ['./cage-notes.component.css'],
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatListModule]
})
export class CageNotesComponent {
  @Input()
  get cage(): Cage { return this._cage; }
  set cage(value: Cage) {
    this.cageNotes = value.fields.Notes;
    this._cage = value;
  }
  private _cage!: Cage;

  @Output() updated = new EventEmitter<boolean>();

  public editCageNotes!: boolean;
  public cageNotes!: string;

  constructor(
    private recyclingService: RecyclingService
  ) { }

  setCageNotes(id: string): void {
    this.recyclingService.setNotes(id, this.cageNotes).pipe(
      tap(() => {
        this.cage.fields.Notes = this.cageNotes;
        this.updated.next(true);
        this.editCageNotes = false;
      })
    ).subscribe();
  }

  cancelEditCageNotes(): void {
    this.cageNotes = this.cage.fields.Notes;
    this.editCageNotes = false;
  }
}