import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, take, tap } from 'rxjs';

import { Doc } from '../../doc';
import { DocsService } from '../../docs.service';

@Component({
  selector: 'gcp-doc-upload',
  templateUrl: './doc-upload.component.html',
  styleUrls: ['./doc-upload.component.css']
})
export class DocUploadComponent implements OnInit {
  @Input() id: string;
  @Output() complete = new EventEmitter<boolean>();

  public docs$: Observable<Doc[]>;
  private uploads$ = new BehaviorSubject<Doc[]>([]);
  public docStarter$ = new BehaviorSubject<string>('');

  constructor(
    private docsService: DocsService
  ) { }

  ngOnInit(): void {
    this.docStarter$.next(this.id)
    this.docs$ = this.docStarter$.pipe(
      switchMap(_ => combineLatest([this.uploads$, this.docsService.listFiles(_).pipe(tap(() => this.uploads$.next([])))])),
      map(_ => [..._[0], ..._[1]])
    );
  }

  fileChangeEvent(id: string, e: any) {
    const files = e.target.files;
    const keys = Array.from(Array(files.length).keys());
    for (let key in keys) {
      const file = files[key];
      this.uploadFile(id, file);
    }
  }

  uploadFile(id: string, file: File): void {
    const date = new Date();
    this.docsService.createUploadSession(id, file).pipe(
      switchMap(upload => this.uploads$.pipe(
        take(1),
        map(pending => {
          const index = pending.findIndex(_ => file.name === _.oldName || file.name === _.name);
          const doc = {oldName: upload.file ? '' : file.name, name: upload.name || file.name, percent: Math.min(upload.percent, 100) || 0, createdDateTime: date.toISOString(), webUrl: upload.webUrl, createdBy: upload.createdBy, file: upload.file} as Doc;
          return index === -1 ? [doc, ...pending] : pending.map(obj => obj.name === file.name ? doc : obj)
          }
        ),
      )),
      tap(_ => this.uploads$.next(_))
    ).subscribe();
  }

  allowDrop(e: DragEvent): void {
    e.preventDefault();
  }

  drop(e: DragEvent): void {
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

  deleteFile(id: string): void {
    this.docsService.deleteFile(this.id, id).subscribe(
      _ => this.docStarter$.next(this.id)
    );
  }

  downloadFile(fileName: string, url: string): void {
    this.docsService.downloadFile(url).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    }
    );
  }





  icon(mime: string): string {
    return this.docsService.icon(mime);
  }

  trackByFn(index: number, doc: Doc) {
    return doc.name;
  }

}
