import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { Doc } from '../../doc';

import { DocsService } from '../../docs.service';

@Component({
  selector: 'gcp-doc-upload',
  templateUrl: './doc-upload.component.html',
  styleUrls: ['./doc-upload.component.css']
})
export class DocUploadComponent implements OnInit {
  @Input() id: string;
  @Output() complete = new EventEmitter<any>();

  public uploads: Array<Doc> = [];

  constructor(
    private docsService: DocsService
  ) { }

  ngOnInit(): void {
  }

  fileChangeEvent(id: string, e: any) {
    const files = e.target.files;
    const keys = Array.from(Array(files.length).keys());

    for (let key in keys) {
      const file = files[key];
      this.uploadFile(id, file);
    }
  }

  uploadFile(id: string, file: File) {
    const date = new Date();
    this.uploads.unshift({name: file.name, percent: 0, createdDateTime: date.toISOString()} as Doc)
    this.docsService.createUploadSession(id, file).pipe(
      tap(_ => {
        this.uploads = this.uploads.map(obj => obj.name === file.name ? {
          name: file.name, percent: Math.min(_.percent, 100), createdDateTime: date.toISOString(), webUrl: _.webUrl, createdBy: _.createdBy, file: _.file
        } as Doc : obj ) ;
        if (_.percent >= 100) {
          this.complete.next(true);
          this.docsService.markWithAttachment(id).subscribe();
        };
      })
    ).subscribe();
  }

  allowDrop(e: DragEvent) {
    e.preventDefault();
  }

  drop(e: DragEvent) {
    e.preventDefault();
    const items = e.dataTransfer.items;
    for (let key in items) {
      let item = items[key];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        this.uploadFile(this.id, file);
      }
    }
  }

  icon(mime: string): string {
    return this.docsService.icon(mime);
  }

  trackByFn(index: number, doc: Doc) {
    return doc.name;
  }

}
