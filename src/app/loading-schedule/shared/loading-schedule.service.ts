import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, firstValueFrom, map, Observable, of, Subject, switchMap, take, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { environment } from '../../../environments/environment';
import { LoadingSchedule } from './loading-schedule';
import { TransportCompany } from './transport-company';
import { PanListService } from '../../shared/pan-list/pan-list.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingScheduleService {
  private _listUrl = 'lists/522873e2-892c-4e3f-8764-88975d7bd8d0';
  private _transportCompaniesListUrl = 'lists/5bed333e-0bc3-41ae-bda4-b851678347d1';
  private _loadingScheduleUrl = `${environment.endpoint}/${environment.siteUrl}/${this._listUrl}`;
  private _transportCompaniesUrl = `${environment.endpoint}/${environment.siteUrl}/${this._transportCompaniesListUrl}`;
  private _nextPage!: string;
  private _loadingScheduleListSubject$ = new BehaviorSubject<LoadingSchedule[]>([]);
  private _loadingScheduleSubject$ = new Subject<LoadingSchedule>();
  private _loadingLoadingSchedule!: boolean;
  private _columns$ = new BehaviorSubject<any>(null);

  public loading = new BehaviorSubject<boolean>(false);
  public panLists: Array<string[]> | undefined;

  constructor(
    private http: HttpClient,
    private shared: SharedService,
    private panListService: PanListService
  ) { }

  private htmlEncode(text: string | null): string {
    return text?.replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/,/g, '&#44;') || '';
  }

  private createUrl(filters: Params): string {
    const filterKeys = Object.keys(filters);
    const params = '?expand=fields(select=TransportCompany,Driver,Spaces,ArrivalDate,LoadingDate,From,To,Status,PanLists,Notes)';
    let url = `${this._loadingScheduleUrl}/items${params}`;
    const parsed = filterKeys.map(key => {
      switch (key) {
        case 'branch':
          return `(fields/To eq '${filters['branch']}' or fields/From eq '${filters['branch']}')`;
        case 'status':
          return `fields/Status ${filters['status'] === 'delivered' ? 'eq' : 'ne'} 'Delivered'`;
        default:
          return '';
      }
    }).filter(_ => _);
    if (!filterKeys.includes('status')) parsed.push(`fields/Status ne 'Delivered'`);
    if(parsed.length > 0) url += '&filter=' + parsed.join(' and ');
    url += `&orderby=fields/ArrivalDate ${filters['status'] === 'delivered' ? 'desc' : 'asc'}`;
    url += `&top=25`;
    return url;
  }

  private getLoadingSchedules(url: string): Observable<LoadingSchedule[]> {
    this._loadingLoadingSchedule = true;
    this.loading.next(true);
    return this.http.get<{['@odata.nextLink']: string, value: LoadingSchedule[]}>(url).pipe(
      tap(_ => {
        this._nextPage = _['@odata.nextLink'];
        this._loadingLoadingSchedule = false;
        this.loading.next(false);
      }),
      map(res => res.value),
      tap(_ => _.forEach(ls => this.parseMultiLine('PanLists', 'PanListsArray', ls)))
    );
  }

  private updateList(res: LoadingSchedule): Observable<LoadingSchedule> {
    return this._loadingScheduleListSubject$.pipe(
      take(1),
      map(_ => {
        const entries = _.map(pallet => pallet);
        const i = entries.findIndex(pallet => pallet.id === res.id);
        if (i > -1) entries[i] = res
        else entries.push(res);
        this._loadingScheduleListSubject$.next(entries);
        return res
      })
    );
  }

  private parseMultiLine(key: string, arrayKey: string, data: any): void {
    const arrayData = data['fields'][key]?.split(/[\r\n]+/);
    data['fields'][arrayKey] = arrayData?.map((line: string) => {
      const data = line?.split(',').map(_ => _.replace(/&#44;/g, ','));
      return data.length === 1 ? data[0] : data;
    });
  }

  getFirstPage(filters: Params): BehaviorSubject<LoadingSchedule[]> {
    this._nextPage = '';
    this._loadingLoadingSchedule = false;
    const url = this.createUrl(filters);
    this.getLoadingSchedules(url).subscribe(_ => this._loadingScheduleListSubject$.next(_));
    return this._loadingScheduleListSubject$;
  }

  getNextPage(): void {
    if (!this._nextPage || this._loadingLoadingSchedule) return;
    this._loadingScheduleListSubject$.pipe(
      take(1),
      switchMap(acc => this.getLoadingSchedules(this._nextPage).pipe(
        map(curr => [...acc, ...curr])
      ))
    ).subscribe(_ => this._loadingScheduleListSubject$.next(_))
  }

  getColumns(): BehaviorSubject<any> {
    this._columns$.pipe(
      take(1),
      map(_ => {
        if (_) return of(_);
        return this.http.get<{value: {name: string}[]}>(`${this._loadingScheduleUrl}/columns`).pipe(
          map(_ => _['value']),
          map(_ => _.reduce((acc, val) => ({ ...acc, [val.name]: val}), {})),
          tap(_ => this._columns$.next(_))
        );
      }),
      switchMap(_ => _)
    ).subscribe();
    return this._columns$;
  }

  getLoadingScheduleEntry(id: string | null): Subject<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    this.http.get<LoadingSchedule>(url).pipe(
      tap(_ => this.parseMultiLine('PanLists', 'PanListsArray', _)),
      tap(_ => this.panLists = _['fields']['PanListsArray']),
    ).subscribe(_ => this._loadingScheduleSubject$.next(_));
    return this._loadingScheduleSubject$;
  }

  addPanList(id: string): Promise<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    return firstValueFrom(this.getLoadingScheduleEntry(id).pipe(
      switchMap(_ => {
        const pans = _.fields.PanListsArray || [];
        const newId = pans.length > 0 ? parseInt(pans[pans.length - 1][0]) + 1 : 1;
        const fields = {PanLists: [...pans, `${newId},`].join('\r\n')};
        return this.http.patch<LoadingSchedule>(url, {fields});
      }),
      tap(_ => {
        this.parseMultiLine('PanLists', 'PanListsArray', _);
        this._loadingScheduleSubject$.next(_);
      })
    ));
  }

  removePanList(id: string, panListId: string): Promise<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    return firstValueFrom(this.getLoadingScheduleEntry(id).pipe(
      switchMap(_ => {
        const pans = _.fields.PanListsArray || [];
        const fields = {PanLists: [...pans.filter(p => `${p[0]}` !== `${panListId}`)].join('\r\n')};
        return this.http.patch<LoadingSchedule>(url, {fields});
      }),
      tap(_ => {
        this.parseMultiLine('PanLists', 'PanListsArray', _);
        this._loadingScheduleSubject$.next(_);
      })
    ));
  }

  sendPanList(id: string, panListId: number, ls: LoadingSchedule): Promise<any> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    const date = new Date();
    const result = date.toLocaleDateString('en-CA');
    return firstValueFrom(this.getLoadingScheduleEntry(id).pipe(
      switchMap(_ => {
        const toUpdate = _.fields.PanListsArray?.find(p => `${p[0]}` === `${panListId}`) || [];
        toUpdate[1] = this.htmlEncode(toUpdate[1]);
        toUpdate[2] = result;
        const fields = {PanLists: _.fields.PanListsArray?.join('\r\n')};
        return this.http.patch<LoadingSchedule>(url, {fields});
      }),
      tap(_ => this.parseMultiLine('PanLists', 'PanListsArray', _)),
      switchMap(_ => this.markPanSent(id)),
      switchMap(_ => this.panListService.getRequestedQuantitiesOnce(id, panListId)),
      switchMap(lines => {
        const rows = lines.map(_ => `<tr><td>${_.fields.ItemNumber}</td><td>${_.fields.Quantity || 0}</td></tr>`).join('');
        const subject = `New pan list for ${ls.fields.To} #${id}-${panListId}`;
        let body = `<p><i>Click <a href="${environment.baseUri}/loading-schedule/${id}?pan=${panListId}">here</a> for more details and to print.</i></p>`
        body += '<p>';
        if (ls.fields.LoadingDate) body += `<strong>Loading date:</strong> ${new Date(ls.fields.LoadingDate).toLocaleDateString('en-AU')}<br>`;
        if (ls.fields.ArrivalDate) body += `<strong>Delivery date:</strong> ${new Date(ls.fields.ArrivalDate).toLocaleDateString('en-AU')}<br>`;
        if (ls.fields.TransportCompany) body += `<strong>Transport:</strong> ${ls.fields.TransportCompany}<br>`;
        if (ls.fields.Driver) body += `<strong>Driver:</strong> ${ls.fields.Driver}<br>`;
        if (ls.fields.Spaces) body += `<strong>Spaces:</strong> ${ls.fields.Spaces}<br>`;
        if (ls.fields.Notes) body += `<strong>Notes:</strong> ${ls.fields.Notes}<br>`;
        body += '</p>';
        body += `<table><tr><th>Item number</th><th>Qty Requested</th></tr>${rows}</table>`;
        const to = [ls.fields.From].map(_ => this.shared.panMap.get(`${_}` || '')).flat(1).filter(_ => _) as string[];
        const cc = [ls.fields.To].map(_ => this.shared.panMap.get(`${_}` || '')).flat(1).filter(_ => _) as string[];
        return this.shared.sendMail(to, subject, body, 'HTML', cc);
      })
    ));
  }

  addPanNote(id: string, panListId: string, note: string | null): Promise<LoadingSchedule> {
    const url = `${this._loadingScheduleUrl}/items('${id}')`;
    return firstValueFrom(this.getLoadingScheduleEntry(id).pipe(
      switchMap(_ => {
        const toUpdate = _.fields.PanListsArray?.find(p => `${p[0]}` === `${panListId}`) || [];
        toUpdate[1] = this.htmlEncode(note);
        const fields = {PanLists: _.fields.PanListsArray?.join('\r\n')};
        return this.http.patch<LoadingSchedule>(url, {fields});
      }),
      tap(_ => {
        this.parseMultiLine('PanLists', 'PanListsArray', _);
        this._loadingScheduleSubject$.next(_);
      })
    ));
  }

  getTransportCompanies(branch: string): Observable<TransportCompany[]> {
    const url = `${this._transportCompaniesUrl}/items?expand=fields(select=Title,Drivers)&filter=fields/Branch eq '${branch}'`;
    return this.http.get<{value: TransportCompany[]}>(url).pipe(
      map(res => res.value),
      tap(_ => _.forEach(_ =>  this.parseMultiLine('Drivers', 'DriversArray', _)))
    );
  }

  addTransportCompany(id: string, drivers: string): Observable<TransportCompany> {
    const fields = {Drivers: drivers};
    return this.http.post<TransportCompany>(`${this._transportCompaniesUrl}/items('${id}')`, {fields});
  }

  markPanSent(id: string): Observable<LoadingSchedule> {
    const fields = {Status: 'Pan list sent'};
    return this.http.patch<LoadingSchedule>(`${this._loadingScheduleUrl}/items('${id}')`, {fields}).pipe(
      switchMap(_ => this.updateList(_))
    );
  }

  markDelivered(id: string): Observable<LoadingSchedule> {
    const fields = {Status: 'Delivered'};
    return this.http.patch<LoadingSchedule>(`${this._loadingScheduleUrl}/items('${id}')`, {fields}).pipe(
      switchMap(_ => this.updateList(_)),
    );
  }

  createLoadingScheduleEntry(v: any, id: string | null, branch: string): Observable<LoadingSchedule> {
    const isNewTransportCompany = v.transportCompany && typeof v.transportCompany === 'string' ? true : false;
    const drivers = v.transportCompany?.fields?.Drivers?.split('\n') || [];
    const isNewDriver = v.transportCompany && v.driver && !drivers.includes(v.driver);
    const transportCompany = v.transportCompany?.fields?.Title?.trim() || v.transportCompany?.trim() || null;
    const itemsUrl = `${this._transportCompaniesUrl}/items`;
    if (isNewDriver) drivers.push(v.driver);

    const fields = {
      LoadingDate: v.loadingDate,
      ArrivalDate: v.arrivalDate,
      Spaces: v.spaces || null,
      TransportCompany: transportCompany,
      Driver: v.driver,
      From: v.from,
      To: v.to,
      Status: v.status,
      Notes: v.notes
    };

    const a = isNewTransportCompany ?
                this.http.post<TransportCompany>(itemsUrl, {fields: {Title: transportCompany, Drivers: drivers.join('\n'), Branch: branch}}) :
              isNewDriver ?
                this.http.patch<TransportCompany>(`${itemsUrl}('${v.transportCompany.id}')`, {fields: {Drivers: drivers.join('\n')}}) :
                of({} as TransportCompany);

    const b = id ?
      this.http.patch<LoadingSchedule>(`${this._loadingScheduleUrl}/items('${id}')`, {fields}) :
      this.http.post<LoadingSchedule>(`${this._loadingScheduleUrl}/items`, {fields});

    return a.pipe(
      switchMap(() => b),
      tap(_ => {
        this.parseMultiLine('PanLists', 'PanListsArray', _);
        this._loadingScheduleSubject$.next(_);
      }),
      switchMap(_ => this.updateList(_))
    )
  }
}