import { EventEmitter, Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, combineLatest, expand, from, lastValueFrom, map, Observable, of, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Doc } from './doc';
import { TransportCompany } from '../../loading-schedule/shared/transport-company';

@Injectable({ providedIn: 'root' })
export class DocsService {
  private endpoint = `${environment.endpoint}/${environment.siteUrl}`;
  private chunkLength = 320 * 1024;

  public docStarter$ = new BehaviorSubject<string>('');
  public uploads$ = new BehaviorSubject<Doc[]>([]);
  public docCount!: number;
  public statusChanged = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient
  ) { }

  private readFragment(file: File, start: number, res: Object): Observable<any> {
    return from(file.slice(start, start + this.chunkLength).arrayBuffer()).pipe(
      switchMap(chunk => {
        const crHeader = `bytes ${start}-${start + chunk.byteLength - 1}/${file.size}`;
        return this.http.put<Doc>(res['uploadUrl'], chunk, {headers: {'Content-Range': crHeader}})
      }),
      map(_ => {return {
        ..._,next: start + this.chunkLength,
        uploadUrl: res['uploadUrl'],
        percent: Math.round((_['size'] || start + this.chunkLength) / file.size * 100),
        oldName: file.name
      }}),
    )
  }

  private createUploadSession(id: string, folder: string, file: File): Observable<any> {
    const url = `${this.endpoint}/drive/root:/${folder}/${id}/${file.name}:/createUploadSession`;
    const payload = {
      'item': {
        '@microsoft.graph.conflictBehavior': 'rename',
        'name': file.name
      }
    };
    return this.http.post(url, payload).pipe(
      expand(res => this.readFragment(file, res['next'] ? res['next'] : 0, res)),
      take(Math.ceil(file.size / this.chunkLength) + 1)
    );
  }

  private listFiles(id: string, folder: string): Observable<Doc[]> {
    const url = `${this.endpoint}/drive/root:/${folder}/${id}:/children?$orderby=name`
    return this.http.get(url).pipe(
      map(_ => _['value']),
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof Error) {
          console.error('An error occurred:', error.error.message);
        } else {
          console.log(`Backend returned code ${error.status}, body was: ${error.error}`);
        }
        return of([])
      }),
      map(_ => _.sort((a: TransportCompany, b: TransportCompany) => b.createdDateTime > a.createdDateTime && 1 || -1))
    );
  }

  getDocListener(folder: string): Observable<[Doc[], number]> {
    return this.docStarter$.pipe(
      switchMap(_ => combineLatest([this.uploads$, this.listFiles(_, folder).pipe(tap(() => this.uploads$.next([])))])),
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

  uploadFile(id: string, folder: string, file: File): Promise<boolean> {
    const date = new Date();
    const uploadSession = this.createUploadSession(id, folder, file).pipe(
      switchMap(upload => this.uploads$.pipe(
        take(1),
        map(pending => {
          const index = pending.findIndex(_ => file.name === _.oldName || file.name === _.name);
          const percent = Math.min(upload.percent, 100) || 0;
          if (percent === 100) this.docStarter$.next(id);
          const doc = {oldName: upload.file ? '' : file.name, name: upload.name || file.name, percent: percent, createdDateTime: date.toISOString(), webUrl: upload.webUrl, createdBy: upload.createdBy, file: upload.file} as Doc;
          return index === -1 ? [doc, ...pending] : pending.map(obj => obj.name === file.name ? doc : obj)
          }
        ),
      )),
      tap(_ => this.uploads$.next(_)),
      map(() => true)
    );
    return lastValueFrom(uploadSession);
  }

  deleteFile(id: string, folder: string, fileName: string): Promise<Object> {
    const url = `${this.endpoint}/drive/root:/${folder}/${id}/${fileName}:`;
    return lastValueFrom(this.http.delete(url));
  }

  downloadFile(url: string): Observable<Blob> {
    return this.http.get<Blob>(url, {responseType: 'blob' as 'json'});
  }

  icon(mime: string): string {
    const path = 'assets';
    switch (mime) {
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