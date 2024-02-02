import { Component, Input, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, tap } from 'rxjs';

import { Doc } from '../doc';
import { DocsService } from '../docs.service';


@Component({
  selector: 'gcp-doc-list',
  templateUrl: './doc-list.component.html',
  styleUrls: ['./doc-list.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatProgressSpinnerModule]
})
export class DocListComponent implements OnInit {
  @Input() folder!: string;
  @Input() subfolder!: string;
  public docs$!: Observable<Doc[]>;
  public docCount!: number;

  constructor(
    private docsService: DocsService,
    private snackBar: MatSnackBar
  ) { }

  get idle(): Observable<boolean> {
    return this.docsService.uploads$.pipe(
      map(_ => _.length === 0)
    )
  }

  ngOnInit(): void {
    this.docs$ = this.docsService.getDocListener(this.folder).pipe(
      tap(_ => this.docCount = _[1]),
      map(_ => _[0])
    );
  }

  deleteFile(fileName: string): void {
    this.docsService.deleteFile(this.subfolder, this.folder, fileName).then(() => {
      this.snackBar.open('File deleted!', '', {duration: 3000});
      this.docsService.docStarter$.next(this.subfolder);
    }).catch(err => {
      this.snackBar.open(err.error?.error?.message || 'Unknown error', '', {duration: 6000});
      console.log(err);
    });
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
      w?.print();
    });
  }

  icon(mime: string): string {
    return this.docsService.icon(mime);
  }

  fileChangeEvent(e: Event): void {
    this.docsService.fileChangeEvent(this.folder, this.subfolder, e);
  }
}
