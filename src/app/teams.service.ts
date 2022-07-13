import { Injectable } from '@angular/core';
import { app } from '@microsoft/teams-js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  public isTeams = new BehaviorSubject<boolean>(false);

  constructor(
  ) {
    app.initialize().then(
      () => this.isTeams.next(true)
    ).catch(() => console.log('Is not teams'));
  }

}
