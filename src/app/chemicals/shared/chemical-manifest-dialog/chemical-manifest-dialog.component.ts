import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe, KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { SharedService } from '../../../shared.service';
import { ChemicalService } from '../chemical.service';
import { LetterheadComponent } from '../../../shared/letterhead/letterhead.component';

@Component({
  selector: 'gcp-chemical-manifest-dialog',
  templateUrl: './chemical-manifest-dialog.component.html',
  styleUrls: ['./chemical-manifest-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, KeyValuePipe, NgForOf, NgIf, MatButtonModule, MatCardModule, MatDialogModule, MatIconModule, LetterheadComponent]
})
export class ChemicalManifestDialogComponent implements OnDestroy, OnInit {
  public manifest = this.chemicalService.getChemicalManifest();
  public date = new Date();
  public address = this.shared.getBranchAddress(this.data.branch);
  public classes = this.chemicalService.classes;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {branch: string},
    private renderer: Renderer2,
    private shared: SharedService,
    private chemicalService: ChemicalService
  ) { }

  ngOnInit(): void {
    this.date = new Date();
    this.renderer.addClass(document.body, 'print-dialog');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'print-dialog');
  }

  print(): void {
    window.print();
  }

}
