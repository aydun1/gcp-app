import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, map, Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { Chemical } from './chemical';

@Injectable({
  providedIn: 'root'
})
export class SdsService {
  public loading = new BehaviorSubject<boolean>(false);
  public defs = {
    'H300': 'Fatal if swallowed',
    'H301': 'Toxic if swallowed',
    'H302': 'Harmful if swallowed',
    'H303': 'May be harmful if swallowed',
    'H304': 'May be fatal if swallowed and enters airways',
    'H305': 'May be harmful if swallowed and enters airways',
    'H310': 'Fatal in contact with skin',
    'H311': 'Toxic in contact with skin',
    'H312': 'Harmful in contact with skin',
    'H313': 'May be harmful in contact with skin',
    'H314': 'Causes severe skin burns and eye damage',
    'H315': 'Causes skin irritation',
    'H316': 'Causes mild skin irritation',
    'H317': 'May cause an allergic skin reaction',
    'H318': 'Causes serious eye damage',
    'H319': 'Causes serious eye irritation',
    'H320': 'Causes eye irritation',
    'H330': 'Fatal if inhaled',
    'H331': 'Toxic if inhaled',
    'H332': 'Harmful if inhaled',
    'H333': 'May be harmful if inhaled',
    'H334': 'May cause allergy or asthma symptoms or breathing difficulties if inhaled',
    'H335': 'May cause respiratory irritation',
    'H336': 'May cause drowsiness or dizziness',
    'H340': 'May cause genetic defects',
    'H341': 'Suspected of causing genetic defects',
    'H350': 'May cause cancer',
    'H351': 'Suspected of causing cancer',
    'H360': 'May damage fertility or the unborn child',
    'H361': 'Suspected of damaging fertility or the unborn child',
    'H362': 'May cause harm to breast-fed children',
    'H370': 'Causes damage to organs',
    'H371': 'May cause damage to organs',
    'H372': 'Causes damage to organs through prolonged or repeated exposure',
    'H373': 'May cause damage to organs through prolonged or repeated exposure',
    'H300+H310': 'Fatal if swallowed or in contact with skin',
    'H300+H330': 'Fatal if swallowed or if inhaled',
    'H301+H311': 'Toxic if swallowed or in contact with skin',
    'H301+H331': 'Toxic if swallowed or if inhaled',
    'H302+H312': 'Harmful if swallowed or in contact with skin',
    'H302+H332': 'Harmful if swallowed or inhaled',
    'H303+H313': 'May be harmful if swallowed or in contact with skin',
    'H303+H333': 'May be harmful if swallowed or if inhaled',
    'H310+H330': 'Fatal in contact with skin or if inhaled',
    'H311+H331': 'Toxic in contact with skin or if inhaled',
    'H312+H332': 'Harmful in contact with skin or if inhaled',
    'H315+H320': 'Causes skin and eye irritation',
    'H313+H333': 'May be harmful in contact with skin or if inhaled',
    'H300+H310+H330': 'Fatal if swallowed, in contact with skin or if inhaled',
    'H301+H311+H331': 'Toxic if swallowed, in contact with skin or if inhaled',
    'H302+H312+H332': 'Harmful if swallowed, in contact with skin or if inhaled',
    'H303+H313+H333': 'May be harmful if swallowed, in contact with skin or if inhaled',
    'H400': 'Very toxic to aquatic life',
    'H401': 'Toxic to aquatic life',
    'H402': 'Harmful to aquatic life',
    'H410': 'Very toxic to aquatic life with long lasting effects',
    'H411': 'Toxic to aquatic life with long lasting effects',
    'H412': 'Harmful to aquatic life with long lasting effects',
    'H413': 'May cause long lasting harmful effects to aquatic life',
    'H420': 'Harms public health and the environment by destroying ozone in the upper atmosphere',
    'H422': 'Hazardous to soil organisms',
    'H441': 'Very toxic to terrestrial invertebrates',
  };

  constructor(
    private http: HttpClient
  ) { }

  getChemical(branch: string, itemNumber: string): Promise<Chemical> {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/chemicals?branch=${branch}&itemNmbr=${itemNumber}`).pipe(
      map(res => res.chemicals[0]),
      tap(_ => {
        const codes = _.hCodes;
        ['0', '1', '2', '3'].forEach(v => {
          const first = codes.indexOf(`H30${v}`);
          const second = codes.indexOf(`H31${v}`);
          const third = codes.indexOf(`H33${v}`);
          if (first !== -1 && second !== -1 || first !== -1 && third !== -1 || second !== -1 && third !== -1) {
            [first, second, third].sort().reverse().forEach(i => codes.splice(i, 1))
            if (first !== -1 && second !== -1 && third !== -1) codes.push(`H30${v}+H31${v}+H33${v}`)
            else if (first !== -1 && second !== -1) codes.push (`H30${v}+H31${v}`)
            else if (first !== -1 && third !== -1) codes.push (`H30${v}+H33${v}`)
            else if (second !== -1 && third !== -1) codes.push (`H31${v}+H33${v}`)
          }
        })
        codes.sort();
      })
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

  getPdf(itemNmbr: string): void {
    const request = this.http.get(`${environment.sdsEndpoint}/sds/${itemNmbr}.pdf`, {responseType: 'blob'}).pipe(
      tap(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${itemNmbr}.pdf`;
        link.href = blobUrl;
        link.dispatchEvent(new MouseEvent(`click`, {bubbles: true, cancelable: true, view: window}));  
      })
    );
    lastValueFrom(request);
  }

  pdfPath(itemNmbr: string): string {
    return `${environment.sdsEndpoint}/sds/${itemNmbr}.pdf`;
  }

  getSyncedChemicals(): Observable<Chemical[]> {
    return this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/synced-materials`).pipe(
      map(res => res.chemicals)
    );
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