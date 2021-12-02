import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http';

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
    const content = 'Content-Type: application/json';
    const payload = {
      'item': {
        'fileSize': file.size,
        'name': file.name
      }
    }

    return this.http.post(url, payload);



  }

}