import { HttpClient,  } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject, map, Observable, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public branches = ['NSW', 'QLD', 'SA', 'VIC', 'WA'];
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
        map((_: any) => _.value),
        tap(_ => this._state$.next(_))
      ))
    )
  }

  getName(): string {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount.name;
  }

}
