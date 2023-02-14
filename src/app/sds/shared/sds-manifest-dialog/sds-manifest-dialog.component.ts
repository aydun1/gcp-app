import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { tap } from 'rxjs';
import { SharedService } from 'src/app/shared.service';
import { SdsService } from '../sds.service';

@Component({
  selector: 'gcp-sds-manifest-dialog',
  templateUrl: './sds-manifest-dialog.component.html',
  styleUrls: ['./sds-manifest-dialog.component.css']
})
export class SdsManifestDialogComponent implements OnDestroy, OnInit {
  public manifest = this.sdsService.getChemicalManifest();
  public date = new Date();
  public address$ = this.shared.getAddress();

  constructor(
    private renderer: Renderer2,
    private shared: SharedService,
    private sdsService: SdsService
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
