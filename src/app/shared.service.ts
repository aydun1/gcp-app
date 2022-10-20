import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl, Title } from '@angular/platform-browser';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { BehaviorSubject, lastValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public territories = {
    'HEA': ['HEA'],
    'NSW': ['NSW', 'NSWSALES'],
    'QLD': ['QLD'],
    'SA': ['SA'],
    'VIC': ['ACT', 'HEATH', 'MISC', 'NT', 'NZ', 'OTHER', 'PRIMARY', 'TAS', 'VIC', 'VICSALES'],
    'WA': ['WA']
  };
  private warehouseStaff = ['michael.johnson@gardencityplastics.com'];
  private _state$ = new BehaviorSubject<string>('');
  private appTitle = this.titleService.getTitle();
  public branches = Object.keys(this.territories);
  public branch!: string;
  public territoryNames = this.branches.concat(['INT', 'NATIONAL']);
  public isWarehouse!: boolean;

  public emailMap = new Map<string, Array<string>>([
    ['QLD', ['qld@gardencityplastics.com', 'megan.williams@gardencityplastics.com']],
    ['NSW', ['nsw@gardencityplastics.com', 'karen.korsch@gardencityplastics.com']],
    ['SA', ['sa@gardencityplastics.com']],
    ['WA', ['wa@gardencityplastics.com']]
  ]);

  public mpa = ['esther.wong@gardencityplastics.com'];

  constructor(
    private http: HttpClient,
    private dom: DomSanitizer,
    private authService: MsalService,
    private titleService: Title
  ) { }

  checkIfWarehouse(accounts: Array<any>) {
    this.isWarehouse = this.warehouseStaff.includes(accounts[0]?.username);
  }

  getPhoto(): Observable<SafeUrl> {
    const url = `${environment.endpoint}/me/photo/$value`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(_ => URL.createObjectURL(_)),
      map(_ => this.dom.bypassSecurityTrustUrl(_))
    );
  }

  getBranch(): Observable<string> {
    const url = `${environment.endpoint}/me/state`;
    return this._state$.pipe(
      switchMap(cur => cur ? of(cur) : this.http.get(url).pipe(
        map(_ => _['value'] ? _['value'] : 'NA'),
        tap(_ => {
          this.branch = _;
          this._state$.next(_);
        })
      ))
    )
  }

  getName(): string {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount?.name || '';
  }


  getAccount(): AccountInfo | null {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount;
  }

  sanitiseName(name: string): string {
    return encodeURIComponent(name.trim().replace('\'', '\'\'').replace('%2F', '/'));
  }

  setTitle(pageTitle: string): void {
    const title =  pageTitle ? `${pageTitle} - ${this.appTitle}` : this.appTitle;
    this.titleService.setTitle(title);
  }

  sendMail(to: Array<string>, subject: string, body: string, contentType: 'Text' | 'HTML'): Promise<Object> {
    const url = `${environment.endpoint}/me/sendMail`;
    const cc = ['aidan.obrien@gardencityplastics.com'];
    const payload  = {
      message: {
        subject: subject,
        body: {
          contentType: contentType,
          content: body,
        },
        toRecipients: to.map(_ => {return {emailAddress: {address: _}}}),
        ccRecipients: cc.map(_ => {return {emailAddress: {address: _}}}),
      },
      saveToSentItems: false
    }
    return lastValueFrom(this.http.post(url, payload));
  }
}
