import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http';
import { expand, from, map, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private endpoint = 'https://graph.microsoft.com/v1.0/sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4';
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
      expand(res => this.readFragment(file, res['next'] ? res['next'] : 0, res)),
      take(Math.ceil(file.size / this.chunkLength) + 1)
    );
  }

  readFragment(file: File, start: number, res: any) {
    return from(file.slice(start, start + this.chunkLength).arrayBuffer()).pipe(
      switchMap(chunk => {
        const crHeader = `bytes ${start}-${start + chunk.byteLength - 1}/${file.size}`;
        return this.http.put(res['uploadUrl'], chunk, {headers: {'Content-Range': crHeader}})
      }),
      map(_ => {return {..._, next: start + this.chunkLength, uploadUrl: res['uploadUrl'], percent: Math.round((_['size'] || start + this.chunkLength) / file.size * 100)}})
    )
  }
}