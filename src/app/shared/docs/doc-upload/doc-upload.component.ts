import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, take, tap } from 'rxjs';

import { Doc } from '../../doc';
import { DocsService } from '../../docs.service';
import { PalletsService } from '../../../pallets/shared/pallets.service';

@Component({
  selector: 'gcp-doc-upload',
  templateUrl: './doc-upload.component.html',
  styleUrls: ['./doc-upload.component.css']
})
export class DocUploadComponent implements OnInit {
  @Input() id: string;
  @Input() folder: string;

  private _docCount: number;
  private _uploads$ = new BehaviorSubject<Doc[]>([]);
  private _docStarter$ = new BehaviorSubject<string>('');
  public docs$: Observable<Doc[]>;

  constructor(
    private docsService: DocsService,
    private palletsService: PalletsService
  ) { }

  ngOnInit(): void {
    this._docStarter$.next(this.id);
    this.docs$ = this._docStarter$.pipe(
      switchMap(_ => combineLatest([this._uploads$, this.docsService.listFiles(_, this.folder).pipe(tap(() => this._uploads$.next([])))])),
      map(_ => [..._[0], ..._[1]]),
      tap(_ => {
        const complete = _.filter(d => d.id).length || 0;
        const attachStatusChanged = this._docCount !== undefined && this._docCount !== complete && (this._docCount === 0 || complete === 0);
        if (attachStatusChanged && this.folder === 'transfers') this.palletsService.markFileAttached(this.id, complete > 0).subscribe();
        this._docCount = complete;
      })
    );
  }

  fileChangeEvent(e: any): void {
    const files = e.target.files;
    const keys = Array.from(Array(files.length).keys());
    for (let key in keys) {
      const file = files[key];
      this.uploadFile(file);
    }
  }

  uploadFile(file: File): void {
    const date = new Date();
    this.docsService.createUploadSession(this.id, this.folder, file).pipe(
      switchMap(upload => this._uploads$.pipe(
        take(1),
        map(pending => {
          const index = pending.findIndex(_ => file.name === _.oldName || file.name === _.name);
          const percent = Math.min(upload.percent, 100) || 0;
          if (percent === 100) this._docStarter$.next(this.id);
          const doc = {oldName: upload.file ? '' : file.name, name: upload.name || file.name, percent: percent, createdDateTime: date.toISOString(), webUrl: upload.webUrl, createdBy: upload.createdBy, file: upload.file} as Doc;
          return index === -1 ? [doc, ...pending] : pending.map(obj => obj.name === file.name ? doc : obj)
          }
        ),
      )),
      tap(_ => this._uploads$.next(_))
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
        this.uploadFile(file);
      }
    }
  }

  deleteFile(fileName: string): void {
    this.docsService.deleteFile(this.id, this.folder, fileName).subscribe(
      _ => this._docStarter$.next(this.id)
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
    });
  }

  printFile(url: string): void {
    this.docsService.downloadFile(url).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const w = window.open(url);
      w.print();
    });
  }

  icon(mime: string): string {
    return this.docsService.icon(mime);
  }

  trackByFn(index: number, doc: Doc): string {
    return doc.name;
  }

}
