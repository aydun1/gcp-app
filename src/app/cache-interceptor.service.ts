import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, catchError, debounceTime, of, tap, throwError } from 'rxjs'

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private messages$ = new Subject<string>();
  private urls = [
    '/gp/orders/2/', // orders
    '/d1874c62-66bf-4ce0-b177-ff5833de9b20/', // runs
    '/gp/deliveries', // drops
  ]
  constructor(
    private snackBar: MatSnackBar
  ) {
    this.messages$.pipe(debounceTime(200)).subscribe(_ => this.snackBar.open(_, '', {duration: 3000}));
  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
    const shouldCache = this.urls.map(_ => req.url.includes(_)).some(_ => _);
    if(!shouldCache || req.method !== 'GET') return next.handle(req);
    const key = req['url'].replace(/^https?:\/\/[a-z\.]+:?[0-9]*/, '');
    return next.handle(req).pipe(
      tap(stateEvent => {
        if (stateEvent instanceof HttpResponse) {
          try {
            localStorage.setItem(key, JSON.stringify(stateEvent));
          } catch {
            console.log('Could not set cache');
          }
        }
      }),
      catchError(stateEvent => {
        if (stateEvent.status === 0) {
          const data = localStorage.getItem(key);
          if (data) {
            this.messages$.next('Using offline data. No internet?');
            return of(new HttpResponse(JSON.parse(data)));
          } else {
            this.messages$.next('Cannot load page. No internet?');
            return throwError(() => new Error(stateEvent));
          };
        } else if (stateEvent.status === 404) {
          return throwError(() => new Error(stateEvent));
        }
        else {
          if (stateEvent instanceof HttpErrorResponse) localStorage?.setItem(key, JSON.stringify(stateEvent));
          return of(new HttpResponse());
        }
      })
    )
  }
}