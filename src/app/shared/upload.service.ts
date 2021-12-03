import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http';
import { from, lastValueFrom, map, mergeMap, Observable, of, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private dataGroupUrl = 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/drive/items/38f14082-02e5-4978-bf92-f42be2220166';
  private chunkLength = 320 * 1024;

  constructor(
    private http: HttpClient
  ) {

  }

  createUploadSession(file: File) {
    const url = this.endpoint + `/drive/root:/transfer-docs/${file.name}:/createUploadSession`;
    const payload = {
      'item': {
        '@microsoft.graph.conflictBehavior': 'rename',
        'name': file.name
      }
    }
    return this.http.post(url, payload).pipe(
      switchMap(res => this.readFragment(file, 0, res['uploadUrl'])),
      tap(_ => console.log(_))
    );
  }

  readFragment(file: File, start: number, url: string) {
    return from(file.slice(start, start + this.chunkLength).arrayBuffer()).pipe(
      switchMap(chunk => this.uploadChunk(file, chunk, url, start, file.size))
    )
  }

  uploadChunk(file: File, chunk: ArrayBuffer, uploadURL: string, start: number, totalLength: number) {   
    const max = start + chunk.byteLength - 1;
    const crHeader = `bytes ${start}-${max}/${totalLength}`;
    return this.http.put(uploadURL, chunk, {headers: {'Content-Range': crHeader}}).pipe(
      switchMap(_ => _['id'] ? of(_) : this.readFragment(file, max, uploadURL))
    )
  }


}