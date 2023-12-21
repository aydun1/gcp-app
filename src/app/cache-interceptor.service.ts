import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, catchError, debounceTime, of, tap, throwError } from 'rxjs'

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private messages$ = new Subject<string>();
  private urls = [
    /^\/v1\.0\/me\/officeLocation$/, // User's office location
    /^\/v1.0\/sites\/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4\/lists\/d1874c62-66bf-4ce0-b177-ff5833de9b20\/items/, // runs
    /^\/gp\/orders\/2\/[a-zA-Z0-9]{9,21}$/, // Order details
    /^\/gp\/orders\?branch\=[A-Z]{2,3}$/, // Tomorrow's orders list
    /^\/gp\/deliveries\?branch=[A-Z]{2,3}$/, // Deliveries
  ];
  constructor(
    private snackBar: MatSnackBar
  ) {
    this.messages$.pipe(debounceTime(200)).subscribe(_ => this.snackBar.open(_, '', {duration: 3000}));
    // Remove data that didn't need to be cached.
    const badKeys = Object.keys(localStorage).filter(key => key.startsWith('/gp')).filter(key =>this.urls.map(u => (!key.match(u))).every(_ => _));
    badKeys.forEach(_ => localStorage.removeItem(_));
  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
    const trimmedUrl = req.url.replace(/^https?:\/\/[a-z\.]+:?[0-9]*/, '');
    const shouldCache = this.urls.map(_ => trimmedUrl.match(_)).some(_ => _);
    if(!shouldCache || req.method !== 'GET') return next.handle(req);
    return next.handle(req).pipe(
      tap(stateEvent => {
        if (stateEvent instanceof HttpResponse) {
          try {
            localStorage.setItem(trimmedUrl, JSON.stringify(stateEvent));
          } catch {
            console.log('Could not set cache');
          }
        }
      }),
      catchError(stateEvent => {
        if (stateEvent.status === 0) {
          const data = localStorage.getItem(trimmedUrl);
          if (data) {
            this.messages$.next('Using offline data.');
            return of(new HttpResponse(JSON.parse(data)));
          } else {
            this.messages$.next('Cannot load data.');
            return throwError(() => new Error(stateEvent));
          };
        } else if (stateEvent.status === 404) {
          return throwError(() => new Error(stateEvent));
        } else if (stateEvent.status === 504) {
          return throwError(() => new Error(stateEvent));
        } else {
          // if (stateEvent instanceof HttpErrorResponse) localStorage.setItem(trimmedUrl, JSON.stringify(stateEvent)); // why???
          return of(new HttpResponse());
        }
      })
    )
  }
}