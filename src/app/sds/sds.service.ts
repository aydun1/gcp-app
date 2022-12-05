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

}