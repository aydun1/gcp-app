import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { tap } from 'rxjs';

import { DocsService } from '../../docs.service';

interface Upload {
  name: string,
  percent: number
}

@Component({
  selector: 'gcp-doc-upload',
  templateUrl: './doc-upload.component.html',
  styleUrls: ['./doc-upload.component.css']
})
export class DocUploadComponent implements OnInit {
  @Input() id: string;
  @Output() complete = new EventEmitter<any>();

  public uploads: Array<Upload> = [];

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
    this.uploads.push({name: file.name, percent: 0})
    this.docsService.createUploadSession(id, file).pipe(
      tap(_ => {



        this.uploads = this.uploads.map(obj => obj.name === file.name ? {name: file.name, percent: _.percent} : obj );
        if (_.percent >= 100) this.complete.next(true);
      })
    ).subscribe();
  }

  allowDrop(e: DragEvent) {
    console.log(111)
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

}
