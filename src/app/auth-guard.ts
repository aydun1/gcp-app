import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Observable, of } from 'rxjs';
import { take, tap } from 'rxjs/operators';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private authService: MsalService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    const account = this.authService.instance.getAllAccounts()[0];
    return of(true);
    //return this.authService.watchLogin().pipe(
    //  take(1),
    //  tap(loggedIn => {
    //    if (!loggedIn) {
    //      console.log('access denied');
    //      this.authService.redirectUrl = state.url;
    //      this.router.navigate(['/login']);
    //    }
    //  })
    //)
  }
}
