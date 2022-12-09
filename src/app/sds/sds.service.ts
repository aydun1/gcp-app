import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Chemical } from './chemical';

@Injectable({
  providedIn: 'root'
})
export class SdsService {
  public loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient
  ) { }

  getChemical(branch: string, itemNumber: string): Promise<Chemical> {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/chemicals?branch=${branch}&itemNmbr=${itemNumber}`).pipe(
      map(res => res.chemicals[0])
    );
    return lastValueFrom(request);
  }

  getOnHandChemicals(branch: string): Promise<Chemical[]> {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/chemicals?branch=${branch}`).pipe(
      map(res => res.chemicals)
    );
    return lastValueFrom(request);
  }

  getSavedChemicals(): any {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/saved-materials`).pipe(
      map(res => res.chemicals)
    );
    return lastValueFrom(request);
  }

  getPdf(docNo: string) {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/get-pdf?docNo=${docNo}`).pipe(
      map(res => res)
    );
    return lastValueFrom(request);
  }

  getSyncedChemicals() {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/synced-materials`).pipe(
      map(res => res.chemicals)
    );
    return lastValueFrom(request);
  }

  syncFromChemwatch() {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/sync-from-cw`);
    return lastValueFrom(request);
  }

  linkChemicalToItem(itemNmbr: string, cwNo: string) {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/link-material?itemNmbr=${itemNmbr}&cwNo=${cwNo}`);
    return lastValueFrom(request);
  }
}