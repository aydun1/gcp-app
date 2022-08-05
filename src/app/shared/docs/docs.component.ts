import { Component, Input, Output } from '@angular/core';
import { DocsService } from './docs.service';

@Component({
  selector: 'gcp-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.css']
})
export class DocsComponent {
  @Input() id!: string;
  @Input() folder!: string;
  @Output() statusChanged = this.docsService.statusChanged;

  public dragOver = false;

  constructor(
    private docsService: DocsService
  ) { }

  ngOnInit(): void {
    if (this.id) this.docsService.docStarter$.next(this.id);
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
    for (let key in items) {
      let item = items[key];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        this.docsService.uploadFile(this.id, this.folder, file);
      }
    }
  }
}
