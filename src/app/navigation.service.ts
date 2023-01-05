import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { Router, NavigationEnd } from '@angular/router'

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private history: string[] = []

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.history.push(event.urlAfterRedirects);
      }
    })
  }

  back(): void {
    this.history.pop();
    const hist = this.history[this.history.length - 1]?.split('/')?.length;
    const curr = this.router.url.split('/').length;
    const pan = this.router.url.match(/pan=([0-9]{1,2})/);
    if (this.history.length > 0 && hist !== curr) {
      this.location.back();
    } else {
      const url = this.router.url.substring(0, this.router.url.lastIndexOf('/'));
      this.router.navigate([url], {queryParams: {pan: pan && curr === 4 ? pan[1] : null}});
    }
  }
}