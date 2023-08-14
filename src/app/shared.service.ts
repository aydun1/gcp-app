import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl, Title } from '@angular/platform-browser';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { BehaviorSubject, lastValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';

import { environment } from '../environments/environment';

interface Address {
  state: string;
  suburb: string;
  address: string;
  postalCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public territories = {
    'HEA': ['HEA'],
    'NSW': ['NSW'],
    'QLD': ['QLD'],
    'SA': ['SA', 'MPASA'],
    'VIC': ['ACT', 'MISC', 'NT', 'OTHER', 'TAS', 'VIC', 'CUSTOM', 'CUSTOMBM'],
    'WA': ['WA']
  };
  private _pallets = [
    {key: 'loscam', name: 'Loscam', image: 'assets/loscam.png'},
    {key: 'chep', name: 'Chep', image: 'assets/chep.png'},
    {key: 'gcp', name: 'GCP', image: 'assets/pallet.png'},
    {key: 'plain', name: 'Plain', image: 'assets/pallet.png'}
  ];
  private _warehouseStaff = ['michael.johnson@gardencityplastics.com'];
  private _state$ = new BehaviorSubject<string>('');
  private _address$ = new BehaviorSubject<string>('');
  public branches = Object.keys(this.territories);
  public territoryNames = this.branches.concat(['INT', 'NATIONAL']);
  public isWarehouse!: boolean;

  public emailMap = new Map<string, Array<string>>([
    ['HEA', ['esther.wong@gardencityplastics.com']],
    ['HEA_MPA', ['esther.wong@gardencityplastics.com']],
    ['QLD', ['qld@gardencityplastics.com', 'megan.williams@gardencityplastics.com']],
    ['QLD_MPA', ['qld@gardencityplastics.com']],
    ['NSW', ['nsw@gardencityplastics.com']],
    ['NSW_MPA', ['nsw@gardencityplastics.com']],
    ['SA', ['sa@gardencityplastics.com', 'robyn.nichol@gardencityplastics.com']],
    ['SA_MPA', ['sa@gardencityplastics.com']],
    ['WA', ['wa@gardencityplastics.com']],
    ['WA_MPA', ['wasales@micropellets.com.au']],
  ]);

  public panMap = new Map<string, Array<string>>([
    ['VIC', ['melb.dispatch@gardencityplastics.com']],
    ['SA', ['robyn.nichol@gardencityplastics.com']]
  ]);

  public offices = [
    {state: 'QLD', suburb: 'Stapylton', address: '19 Eastern Service Road', postalCode: '4207'},
    {state: 'HEA', suburb: 'Heatherton', address: '6 Madden Road', postalCode: '3202'},
    {state: 'NSW', suburb: 'Somersby', address: '4 - 6 Pinnacle Place', postalCode: '2250'},
    {state: 'SA', suburb: 'Wingfield', address: '10-12 Hakkinen Road', postalCode: '5013'},
    {state: 'VIC', suburb: 'Dandenong South', address: 'EJ Court (off Assembly Drive)', postalCode: '3175'},
    {state: 'WA', suburb: 'Forrestfield', address: 'Facility 4, 271 Berkshire Rd', postalCode: '6058'}
  ];

  get pallets(): string[] {
    return this._pallets.map(_ => _.name);
  }

  get palletDetails() {
    return this._pallets;
  }

  constructor(
    private http: HttpClient,
    private dom: DomSanitizer,
    private authService: MsalService,
    private titleService: Title
  ) { }

  checkIfWarehouse(accounts: Array<any>) {
    this.isWarehouse = this._warehouseStaff.includes(accounts[0]?.username);
  }

  getPhoto(): Observable<SafeUrl> {
    const url = `${environment.endpoint}/me/photo/$value`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(_ => URL.createObjectURL(_)),
      map(_ => this.dom.bypassSecurityTrustUrl(_))
    );
  }

  getBranch(): Observable<string> {
    const url = `${environment.endpoint}/me/officeLocation`;
    return this._state$.pipe(
      switchMap(cur => cur ? of(cur) : this.http.get<{value: string}>(url).pipe(
        map(_ => this.offices.find(o => o.suburb === _['value'])?.state || 'NA'),
        tap(_ => this._state$.next(_))
      ))
    )
  }

  getBranchAddress(branch: string): Address {
    return this.offices.find(o => o.state === branch) || {} as Address;
  }

  getOwnAddress(): Observable<{street: string, city: string, state: string, postalCode: string}> {
    const url = `${environment.betaEndpoint}/me/profile/positions`;
    return this._address$.pipe(
      switchMap(cur => cur ? of(cur) : this.http.get<any>(url).pipe(
        map(_ => _['value'] ? _['value'][0]?.detail?.company?.address || {} : {}),
        tap(_ => this._address$.next(_))
      ))
    )
  }

  getName(): string {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount?.name || '';
  }

  getOwnEmail(): string {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount?.username || '';
  }

  getAccount(): AccountInfo | null {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount;
  }

  getRoles(): {all: boolean, runs: boolean} {
    const roles = this.getAccount()?.idTokenClaims?.roles || [];
    return {all: roles.includes('Section.All'), runs: roles.includes('Section.Runs')};
  }

  sanitiseName(name: string): string {
    if (!name) return '';
    return encodeURIComponent(name.trim().replace('\'', '\'\'').replace('%2F', '/'));
  }

  setTitle(pageTitle: string): void {
    const title = `${pageTitle} | IMS`;
    this.titleService.setTitle(title);
  }

  getHistory(itemNmbr: string | undefined): Promise<any[]> {
    const request = this.http.get<{history: any[]}>(`${environment.gpEndpoint}/inventory/${itemNmbr}/history`).pipe(
      map(_ => _.history)
    );
    return lastValueFrom(request);
  }

  getTransactions(branch: string | null, itemNmbr: string | undefined): Promise<any[]> {
    const request = this.http.get<{invoices: any[]}>(`${environment.gpEndpoint}/inventory/${itemNmbr}/current?branch=${branch}`).pipe(
      map(_ => _.invoices)
    );
    return lastValueFrom(request);
  }

  sendMail(to: Array<string>, subject: string, body: string, contentType: 'Text' | 'HTML', cc: Array<string> = []): Promise<Object> {
    const url = `${environment.endpoint}/me/sendMail`;
    cc = [...new Set([...cc, this.getOwnEmail(), 'aidan.obrien@gardencityplastics.com'])];
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
