import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SharedService } from '../../../shared.service';
import { ChemicalService } from '../chemical.service';

@Component({
  selector: 'gcp-chemical-manifest-dialog',
  templateUrl: './chemical-manifest-dialog.component.html',
  styleUrls: ['./chemical-manifest-dialog.component.css']
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
