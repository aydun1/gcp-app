import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, lastValueFrom, map, Observable, switchMap, take, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Chemical } from './chemical';

@Injectable({
  providedIn: 'root'
})
export class ChemicalService {
  private _chemicalListSubject$ = new BehaviorSubject<Chemical[]>([]);

  public loading = new BehaviorSubject<boolean>(false);
  public defs = {
    'H225': 'Highly flammable liquid and vapour',
    'H227': 'Combustible liquid',
    'H272': 'May intensify fire; oxidiser',
    'H290': 'May be corrosive to metals',
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
    'non-hazardous': 'Non-hazardous'
  };

  public classes = {
    3: 'Flammable liquids',
    4: 'Flammable solids',
    5.1: 'Oxidising substances',
    6.1: 'Toxic substances',
    8: 'Corrosives',
    9: 'Miscellaneous',
    'None': 'No DG class'
  };

  constructor(
    private http: HttpClient
  ) { }

  getChemical(branch: string, itemNumber: string): Promise<Chemical> {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/chemicals?branch=&itemNmbr=${itemNumber}`).pipe(
      map(res => res.chemicals[0]),
      tap(_ => {
        const codes = _.hCodes || [];
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

  getOnHandChemicals(branch: string, category: string, sort: string, order: string): Observable<Chemical[]> {
    this.loading.next(true);
    const url = `${environment.gpEndpoint}/chemicals?branch=${branch}&category=${category}&orderby=${sort || 'product'}&order=${order || 'asc'}`;
    return this._chemicalListSubject$.pipe(
      take(1),
      switchMap(() => this.http.get<{chemicals: Chemical[]}>(url)),
      tap(_ => this._chemicalListSubject$.next(_['chemicals'])),
      switchMap(() => this._chemicalListSubject$),
      tap(() => this.loading.next(false))
    );
  }

  reorder(key: string, order: string): void {
    firstValueFrom(this._chemicalListSubject$).then(
      _ => this._chemicalListSubject$.next(
        _.sort((a, b) => (a[key] || 0) - (b[key] || 0))
      )
    )
  }

  getSavedChemicals(): any {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/saved-materials`).pipe(
      map(res => res.chemicals)
    );
    return lastValueFrom(request);
  }

  private updateList(chemical: Chemical): Observable<Chemical> {
    delete chemical['Bin'];
    delete chemical['QtyOnHand'];
    return this._chemicalListSubject$.pipe(
      take(1),
      map(_ => {
        const chemicals = _.map(pallet => pallet);
        const i = chemicals.findIndex(pallet => pallet.ItemNmbr === chemical.ItemNmbr);
        if (i > -1) chemicals[i] = {...chemicals[i], ...chemical}
        else chemicals.unshift(chemical);
        this._chemicalListSubject$.next(chemicals);
        return chemical;
      })
    );
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
      map(res => res.chemicals.map(
        c => {
          return {...c, key: c.Name?.toLocaleLowerCase()}
        }
      ))
    );
  }

  getNonInventoryChemicals(branch: string): Observable<Chemical[]> {
    return this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/non-inventory-chemicals?branch=${branch}`).pipe(
      map(res => res.chemicals.map(
        c => {
          return {...c, key: c.Name?.toLocaleLowerCase()};
        }
      ))
    );
  }

  addNonInventoryChemicals(itemNmbr: string, itemDesc: string, size: number, units: string): Promise<Chemical[]> {
    const payload = {itemNmbr, itemDesc, size, units};
    const res = this.http.post<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/non-inventory-chemicals`, payload).pipe(
      map(res => res.chemicals.map(
        c => {
          return {...c, key: c.Name?.toLocaleLowerCase()};
        }
      ))
    );
    return lastValueFrom(res);
  }

  updateNonInventoryChemicalQuantity(itemNmbr: string, quantity: number, branch: string): Promise<boolean> {
    const payload = {itemNmbr, quantity, branch};
    const res = this.http.post<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/non-inventory-chemical-qty`, payload).pipe(map(() => true))
    return lastValueFrom(res);
  }

  getChemicalManifest(): Observable<{[key: string]: {l: number, kg: number}}> {
    return this._chemicalListSubject$.pipe(
      map(chemicals => {
        return chemicals.filter(_ => _['class'] !== '').reduce((acc: any, val: any) => ({ ...acc, [val.class]: {
          'l': (acc[val.class]?.l || 0) + (val['uofm'] === 'L' ? val['quantity'] : 0),
          'kg': (acc[val.class]?.kg || 0) + (val['uofm'] === 'kg' ? val['quantity'] : 0),
        }}), {})
      })
    );
  }

  syncFromChemwatch(): Promise<any> {
    const request = this.http.get<{chemicals: Chemical[]}>(`${environment.gpEndpoint}/sync-from-cw`);
    return lastValueFrom(request);
  }

  linkChemicalToItem(itemNmbr: string, cwNo: string): Promise<Chemical> {
    const request = this.http.get<Chemical>(`${environment.gpEndpoint}/link-material?itemNmbr=${itemNmbr}&cwNo=${cwNo}`).pipe(
      switchMap(_ => this.updateList(_))
    );
    return lastValueFrom(request);
  }

  unlinkChemicalFromItem(itemNmbr: string): Promise<Chemical> {
    const request = this.http.get<Chemical>(`${environment.gpEndpoint}/unlink-material?itemNmbr=${itemNmbr}`).pipe(
      switchMap(_ => this.updateList(_))
    );
    return lastValueFrom(request);
  }

  exportToCsv(filename: string, rows: Array<any>): void {
    if (!rows || rows.length === 0) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator);
      }).join('\n');
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}