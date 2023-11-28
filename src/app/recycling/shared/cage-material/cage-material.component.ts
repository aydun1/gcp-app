import { Component, EventEmitter, Input, Output } from '@angular/core';
import { tap } from 'rxjs';
import { Cage } from '../cage';
import { RecyclingService } from '../recycling.service';

@Component({
  selector: 'gcp-cage-material',
  templateUrl: './cage-material.component.html',
  styleUrls: ['./cage-material.component.css']
})
export class CageMaterialComponent {
  public canEdit = true;

  @Input()
  get cage(): Cage { return this._cage; }
  set cage(value: Cage) {
    this.cageMaterial = value.fields.Material;
    this.canEdit = value.fields.Status !== 'Complete';
    this._cage = value;
  }
  private _cage!: Cage;

  @Output() updated = new EventEmitter<boolean>();

  public editCageMaterial!: boolean;
  public cageMaterial!: number | null;
  public materials = this.recyclingService.materials;

  constructor(
    private recyclingService: RecyclingService
  ) { }

  setCageMaterial(id: string): void {
    this.recyclingService.setMaterial(id, this.cageMaterial).pipe(
      tap(() => {
        this.cage.fields.Material = this.cageMaterial || null;
        this.updated.next(true);
        this.editCageMaterial = false;
      })
    ).subscribe();
  }

  cancelEditCageMaterial(): void {
    this.cageMaterial = this.cage.fields.Material;
    this.editCageMaterial = false;
  }

}
