import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { DocsService } from '../docs.service';

@Component({
  selector: 'gcp-doc-upload',
  templateUrl: './doc-upload.component.html',
  styleUrls: ['./doc-upload.component.css']
})
export class DocUploadComponent implements OnInit {
  @Input() id!: string;
  @Input() folder!: string;

  constructor(
    private docsService: DocsService
  ) { }

  ngOnInit(): void {
  }

  fileChangeEvent(e: any): void {
    const files = e.target.files;
    const keys = Array.from(Array(files.length).keys());
    for (let key in keys) {
      const file = files[key];
      this.docsService.uploadFile(this.id, this.folder, file);
    }
  }

}
