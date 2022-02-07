import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { AuthenticationResult, InteractionStatus, PopupRequest, EventMessage, EventType, AccountInfo } from '@azure/msal-browser';
import { filter, interval, Observable, Subject, takeUntil, withLatestFrom } from 'rxjs';

import { SharedService } from './shared.service';
import { AutomateService } from './shared/automate.service';

@Component({
  selector: 'gcp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();
  private checkInterval = 1000 * 60 * 60 * 6;  // 6 hours
  public title = 'Pallet Management System';
  public loginDisplay: boolean;
  public accounts: AccountInfo[];
  public photo$: Observable<SafeUrl>;
  public mobileQuery: MediaQueryList;
  public isMobile: boolean;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private swUpdate: SwUpdate,
    private authService: MsalService,
    private location: Location,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private sharedService: SharedService,
    private observer: BreakpointObserver,
    private automateService: AutomateService,
  ) { }

  ngOnInit(): void {
    this.setLoginDisplay();
    this.observer.observe(['(max-width: 600px)']).subscribe(_ => this.isMobile = _.matches);
    this.authService.instance.enableAccountStorageEvents();

    this.msalBroadcastService.msalSubject$.pipe(
      filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED)
    ).subscribe((result: EventMessage) => {
      if (this.authService.instance.getAllAccounts().length === 0) {
        this.router.navigate(['/']);
      } else {
        this.setLoginDisplay();
      }
    });

    this.msalBroadcastService.inProgress$.pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None),
      takeUntil(this._destroying$)
    ).subscribe(() => {
      this.setLoginDisplay();
      this.checkAndSetActiveAccount();
    });

    if (this.swUpdate.isEnabled) {
      withLatestFrom()
      this.swUpdate.versionUpdates.pipe(
        filter(evt => evt.type === 'VERSION_READY')
      ).subscribe(() => {
        location.reload();
        //this.swUpdate.activateUpdate().then(_ => console.log(_));
        //const snackBarRef = this.snackBar.open('Application updated. Refresh page to apply changes.', 'Refresh');
        //snackBarRef.onAction().subscribe(() => location.reload());
      });
      this.checkForUpdates();
      interval(this.checkInterval).subscribe(() => this.checkForUpdates());
    }
  }

  checkForUpdates(): void {
    this.swUpdate.checkForUpdate().then(
      () => console.log('Checking for application updates')
    ).catch(
      e => console.error('error when checking for update', e)
    );
  }

  setLoginDisplay(): void {
    const accounts = this.authService.instance.getAllAccounts();
    this.accounts = accounts;
    this.loginDisplay = accounts.length > 0;
    if (!this.loginDisplay && this.location.path() === '/logout') this.router.navigate(['/']);
    if (this.loginDisplay) this.getPhoto();
  }

  getPhoto(): void {
    this.photo$ = this.sharedService.getPhoto();
  }

  checkAndSetActiveAccount(){
    const activeAccount = this.authService.instance.getActiveAccount();
    const allAccounts = this.authService.instance.getAllAccounts();
    if (!activeAccount && allAccounts.length > 0) {
      this.authService.instance.setActiveAccount(allAccounts[0]);
    }
  }

  login(): void {
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginPopup({...this.msalGuardConfig.authRequest} as PopupRequest).subscribe(
        (response: AuthenticationResult) =>
          this.authService.instance.setActiveAccount(response.account)
      );
    } else {
      this.authService.loginPopup().subscribe((response: AuthenticationResult) =>
        this.authService.instance.setActiveAccount(response.account)
      );
    }
  }

  urlActive(url: string): boolean {
    return this.router.url.startsWith(url);
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
  }
}