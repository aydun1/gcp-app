import { EventEmitter, Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, combineLatest, expand, from, lastValueFrom, map, Observable, of, retry, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Doc } from './doc';

@Injectable({ providedIn: 'root' })
export class DocsService {
  private _endpoint = `${environment.endpoint}/${environment.siteUrl}`;
  private _chunkLength = 3 * 320 * 1024;
  private _lastViewed = '';
  public docStarter$ = new BehaviorSubject<string>('');
  public uploads$ = new BehaviorSubject<Doc[]>([]);
  public docCount!: number;
  public statusChanged = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient
  ) { }

  private readFragment(file: File, start: number, res: {next: number}): Observable<Doc> {
    return from(file.slice(start, start + this._chunkLength).arrayBuffer()).pipe(
      switchMap(chunk => {
        const crHeader = `bytes ${start}-${start + chunk.byteLength - 1}/${file.size}`;
        return this.http.put<Doc>(res['uploadUrl'], chunk, {headers: {'Content-Range': crHeader}})
      }),
      retry({delay: 3000}),
      map(_ => {return {
        ..._,
        next: start + this._chunkLength,
        uploadUrl: res['uploadUrl'],
        percent: Math.round((_['size'] || start + this._chunkLength) / file.size * 100),
        oldName: file.name
      }}),
    )
  }

  private createUploadSession(folder: string, subfolder: string, file: File): Observable<Doc> {
    const url = `${this._endpoint}/drive/root:/${folder}/${subfolder}/${file.name}:/createUploadSession`;
    const payload = {
      'item': {
        '@microsoft.graph.conflictBehavior': 'rename',
        'name': file.name
      }
    };
    return this.http.post<{next: number}>(url, payload).pipe(
      retry({delay: 3000}),
      expand(res => this.readFragment(file, res['next'] ? res['next'] : 0, res)),
      take(Math.ceil(file.size / this._chunkLength) + 1)
    );
  }

  private listFiles(id: string, folder: string): Observable<Doc[]> {
    const url = `${this._endpoint}/drive/root:/${folder}/${id}:/children?$orderby=name`
    return this.http.get<{value: Doc[]}>(url).pipe(
      map(_ => _['value']),
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof Error) {
          console.error('An error occurred:', error.error.message);
        } else {
          console.log(`Backend returned code ${error.status}, body was: ${error.error}`);
        }
        return of([]);
      }),
      map(_ => _.sort((a, b) => b.createdDateTime > a.createdDateTime && 1 || -1))
    );
  }

  getDocListener(folder: string): Observable<[Doc[], number]> {
    return this.docStarter$.pipe(
      map(_ => _ || this._lastViewed),
      tap(_ => this._lastViewed = _),
      switchMap(_ => combineLatest([this.uploads$.pipe(), this.listFiles(_, folder)])),
      map(_ => [..._[0], ..._[1]]),
      map(_ => {
        const complete = _.filter(d => d.id).length || 0;
        const attachStatusChanged = this.docCount !== undefined && this.docCount !== complete && (this.docCount === 0 || complete === 0);
        if (attachStatusChanged) this.statusChanged.emit(complete > 0);
        this.docCount = complete;
        return [_, this.docCount];
      })
    );
  }

  uploadFile(folder: string, subfolder: string, file: File): Promise<boolean> {
    const date = new Date();
    const uploadSession = this.createUploadSession(folder, subfolder, file).pipe(
      switchMap(upload => this.uploads$.pipe(
        take(1),
        map(pending => {
          const createdDateTime = date.toISOString();
          console.log(createdDateTime);
          const index = pending.findIndex(_ => createdDateTime === _.createdDateTime);
          const percent = Math.min(upload.percent, 100) || 0;
          const parentReference = {path:`/drive/root:/debtors/${folder}/${subfolder}`};
          if (percent === 100) this.docStarter$.next('');
          const doc = {parentReference, oldName: upload.file ? '' : file.name, name: upload.name || file.name, percent: percent, createdDateTime, webUrl: upload.webUrl, createdBy: upload.createdBy, file: upload.file} as Doc;
          return index === -1 ? [doc, ...pending] : pending.map(obj => obj.name === file.name ? doc : obj);
          }
        ),
      )),
      tap(_ => this.uploads$.next(_.filter(doc => doc.percent !== 100))),
      map(() => true)
    );
    return lastValueFrom(uploadSession);
  }

  deleteFile(id: string, folder: string, fileName: string): Promise<null> {
    const url = `${this._endpoint}/drive/root:/${folder}/${id}/${fileName}:`;
    return lastValueFrom(this.http.delete(url).pipe(map(() => null)));
  }

  downloadFile(url: string): Observable<Blob> {
    return this.http.get<Blob>(url, {responseType: 'blob' as 'json'});
  }

  fileChangeEvent(folder: string, subfolder: string, e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    const keys = Array.from(Array(files?.length).keys());
    for (const key in keys) {
      const file = files[key];
      this.uploadFile(folder, subfolder, file);
    }
  }

  icon(mime: string): string {
    const path = 'assets';
    switch (mime) {
      case 'folder':
        return `${path}/folder.svg`;
      case 'application/pdf':
        return `${path}/pdf.svg`;
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return `${path}/xlsx.svg`;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return `${path}/docx.svg`;
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return `${path}/pptx.svg`;
      case 'application/zip':
        return `${path}/zip.svg`;
      case 'image/png':
      case 'image/jpeg':
        return `${path}/photo.svg`;
      case 'image/svg+xml':
        return `${path}/vector.svg`;
        case 'text/plain':
          return `${path}/txt.svg`;
      default:
        return `${path}/genericfile.svg`;
    }
  }
}