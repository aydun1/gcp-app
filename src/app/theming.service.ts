import { ApplicationRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ThemingService {
  public theme = new BehaviorSubject(false);

  constructor(private ref: ApplicationRef) {
    // initially trigger dark mode if preference is set to dark mode on system
    const darkModeOn = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
    if (darkModeOn) this.theme.next(true);
    
    // watch for changes of the preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      const isDark = e.matches;
      this.theme.next(isDark);
    });
  }
}
