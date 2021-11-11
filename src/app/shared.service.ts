import { HttpClient,  } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MsalService } from '@azure/msal-angular';
import { map, Observable, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor(
    private http: HttpClient,
    private dom: DomSanitizer,
    private authService: MsalService,
  ) { }



  getPhoto(): Observable<any> {
    const url = 'https://graph.microsoft.com/v1.0/me/photo/$value';
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(_ => URL.createObjectURL(_)),
      map(_ => this.dom.bypassSecurityTrustUrl(_))
    );
  }

  getName(): string {
    const activeAccount = this.authService.instance.getActiveAccount();
    return activeAccount.name;
  }
}
