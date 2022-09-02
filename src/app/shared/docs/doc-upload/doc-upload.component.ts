import { Component, Input } from '@angular/core';

import { DocsService } from '../docs.service';

@Component({
  selector: 'gcp-doc-upload',
  templateUrl: './doc-upload.component.html',
  styleUrls: ['./doc-upload.component.css']
})
export class DocUploadComponent {
  @Input() id!: string;
  @Input() folder!: string;

  constructor(
    private docsService: DocsService
  ) { }

  fileChangeEvent(e: any): void {
    const files = e.target.files;
    const keys = Array.from(Array(files.length).keys());
    for (let key in keys) {
      const file = files[key];
      this.docsService.uploadFile(this.id, this.folder, file);
    }
  }

}
