import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, expand, from, map, Observable, of, switchMap, take } from 'rxjs';

import { environment } from '../../environments/environment';
import { Doc } from './doc';
import { TransportCompany } from '../loading-schedule/shared/transport-company';

@Injectable({ providedIn: 'root' })
export class DocsService {
  private endpoint = `${environment.endpoint}/${environment.siteUrl}`;
  private chunkLength = 320 * 1024;

  constructor(
    private http: HttpClient
  ) { }

  listFiles(id: string, folder: string): Observable<Doc[]> {
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

  createUploadSession(id: string, folder: string, file: File): Observable<any> {
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

  readFragment(file: File, start: number, res: Object): Observable<any> {
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

  deleteFile(id: string, folder: string, fileName: string): Observable<Object> {
    const url = `${this.endpoint}/drive/root:/${folder}/${id}/${fileName}:`;
    return this.http.delete(url);
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