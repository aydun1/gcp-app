import { Injectable } from '@angular/core';
import { app } from '@microsoft/teams-js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  public isTeams = new BehaviorSubject<boolean | undefined>(undefined);

  constructor(
  ) {
    app.initialize().then(
      () => {
        this.isTeams.next(true);
        app.notifySuccess();
      }
    ).catch(
      () =>this.isTeams.next(false)
    );
  }

}
