import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject, map, Observable, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public territories = {
    'NSW': ['NSW', 'NSWSALES'],
    'QLD': ['QLD'],
    'SA': ['SA'],
    'VIC': ['ACT', 'HEATH', 'MISC', 'NT', 'NZ', 'OTHER', 'PRIMARY', 'TAS', 'VIC', 'VICSALES'],
    'WA': ['WA']
  };
  public branches = Object.keys(this.territories);
  public territoryNames = this.branches.concat(['INT', 'NATIONAL']);
  private _state$ = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    private dom: DomSanitizer,
    private authService: MsalService,
  ) { }

  getPhoto(): Observable<SafeUrl> {
    const url = 'https://graph.microsoft.com/v1.0/me/photo/$value';
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(_ => URL.createObjectURL(_)),
      map(_ => this.dom.bypassSecurityTrustUrl(_))
    );
  }

  getBranch(): Observable<string> {
    const url = 'https://graph.microsoft.com/v1.0/me/state';
    return this._state$.pipe(
      switchMap(cur => cur ? of(cur) : this.http.get(url).pipe(
        map(_ => _['value'] ? _['value'] : 'NA'),
        tap(_ => this._state$.next(_))
      ))
    )
  }

  getName(): string {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount.name;
  }

  sanitiseName(name: string): string {
    return encodeURIComponent(name.replace('\'', '\'\''));
  }
}
