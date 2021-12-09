import { HttpClient,  } from '@angular/common/http';
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
    'QLD': ['QLD', 'QLDSALES'],
    'SA': ['SA', 'SASALES'],
    'VIC': ['ACT', 'HEATH', 'MISC', 'NT', 'NZ', 'OTHER', 'PRIMARY', 'VIC', 'VICSALES'],
    'WA': ['WA', 'WASALES']
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

  getBranch(): Observable<any> {
    const url = 'https://graph.microsoft.com/beta/me/state';
    return this._state$.pipe(
      switchMap(cur => cur ? of(cur) : this.http.get(url).pipe(
        map((_: any) => _.value ? _.value : 'NA'),
        tap(_ => this._state$.next(_))
      ))
    )
  }

  getName(): string {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount.name;
  }

  sanitiseName(name: string) {
    return encodeURIComponent(name.replace('\'', '\'\''));
  }
}
