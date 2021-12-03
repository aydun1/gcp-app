import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, map, Observable, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private dataGroupUrl = 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/drive/items/38f14082-02e5-4978-bf92-f42be2220166';
  private palletTrackerUrl = `${this.endpoint}/${this.dataGroupUrl}`;
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
      tap(_ => console.log(_)),
      switchMap((res: {uploadUrl: string}) => this.uploadChunks(file, res.uploadUrl)),
      tap(_ => console.log(_))
    );
  }

  uploadChunks(file: File, uploadUrl: string) {
    const position = 0;
    const start = 0;
    let stop = position + this.chunkLength;
    this.readFragment(file, start, stop, uploadUrl)
  }


  readFragment(file: File, start: number, stop: number, url: string) {
    const blob = file.slice(start, stop);
    return blob.arrayBuffer().then(arrayBuffer => this.uploadChunk(file, arrayBuffer, url, start, file.size));
  }

  uploadChunk(file: File, chunk: any | ArrayBuffer, uploadURL: string, position: number, totalLength: number) {   
    const max = position + chunk.byteLength - 1;
    const crHeader = `bytes ${position}-${max}/${totalLength}`;
    return lastValueFrom(this.http.put(uploadURL, chunk, {headers: {'Content-Range': crHeader}})).then((res: {uploadUrl: string}) => 
      this.readFragment(file, max, max+this.chunkLength, uploadURL)
    );
  }


}