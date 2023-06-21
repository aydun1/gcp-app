import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, catchError, of, tap } from 'rxjs'

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar
  ) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
    if(req.method !== 'GET') return next.handle(req);
    const key = req['url'].replace(/^https?:\/\/[a-z\.]+:?[0-9]*/, '');
    return next.handle(req).pipe(
      tap(stateEvent => {
        if (stateEvent instanceof HttpResponse) localStorage?.setItem(key, JSON.stringify(stateEvent));
      }),
      catchError(_ => {
        if (_.status === 0) {
          this.snackBar.open('Using offline data. No internet?', '', {duration: 3000})
          return of(new HttpResponse(JSON.parse(localStorage?.getItem(key) || '[]')));
        } else {
          return of(new HttpResponse());
        }
      })
    )
  }
}