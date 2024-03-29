import { Component, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { DocsService } from './docs.service';
import { DocListComponent } from './doc-list/doc-list.component';

@Component({
  selector: 'gcp-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.css'],
  standalone: true,
  imports: [MatButtonModule, DocListComponent]
})
export class DocsComponent implements OnInit {
  @Input() folder!: string;
  @Input() subfolder!: string;
  @Output() statusChanged = this.docsService.statusChanged;

  public dragOver = false;

  constructor(
    private docsService: DocsService
  ) { }

  ngOnInit(): void {
    if (this.subfolder) this.docsService.docStarter$.next(this.subfolder);
  }

  allowDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  addClass(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = true;
  }

  removeClass(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = false;
  }

  drop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    const items = e.dataTransfer?.items;
    for (const key in items) {
      const item = items[+key];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) this.docsService.uploadFile(this.folder, this.subfolder, file);
      }
    }
  }

  fileChangeEvent(e: Event): void {
    this.docsService.fileChangeEvent(this.folder, this.subfolder, e);
  }

}
