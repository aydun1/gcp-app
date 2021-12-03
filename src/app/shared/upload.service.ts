import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
  private dataGroupUrl = 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4/drive/items/38f14082-02e5-4978-bf92-f42be2220166';
  private palletTrackerUrl = `${this.endpoint}/${this.dataGroupUrl}`;

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
    return this.http.post(url, payload);
  }

  uploadChunks(file: File, uploadUrl) {
    const homeService = this;

    const position = 0;
    const chunkLength = 320 * 1024;
    let continueRead = true;


    let stop = position + chunkLength;

    
  }


  readFragment(file: File, start: number, stop: number) {
    let frag = '' as string | ArrayBuffer;
    const reader = new FileReader();
    const blob = file.slice(start, stop);
    reader.readAsArrayBuffer(blob);
    reader.onload = () => {
      if (reader.readyState == reader.DONE) {
        frag = reader.result
      }
    };
  }

  uploadChunk(chunk: any | ArrayBuffer, uploadURL: string, position: number, totalLength: number): Observable<any> {     
    const max = position + chunk.byteLength - 1;
    const crHeader = `bytes ${position}-${max}/${totalLength}`;
    return this.http.put(uploadURL, chunk, {headers: {'Content-Range': crHeader}})
  }


}