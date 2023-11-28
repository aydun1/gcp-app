import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Router, NavigationEnd } from '@angular/router'

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private _history: string[] = [];

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.router.getCurrentNavigation()?.extras?.replaceUrl) this._history.pop();       
        this._history.push(event.urlAfterRedirects);
      }
    })
  }

  back(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/']);
  }

  backOld(): void {
    this._history.pop();
    const hist = this._history[this._history.length - 1]?.split('/')?.length;
    const curr = this.router.url.split('/').length;
    if (this._history.length > 0 && hist !== curr) {
      this.location.back();
    } else {
      this.router.navigateByUrl(this._history[this._history.length - 1]);
    }
  }
}