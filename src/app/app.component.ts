import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, EventMessage, EventType, AccountInfo, RedirectRequest } from '@azure/msal-browser';
import { filter, interval, map, Observable, Subject, takeUntil, tap, withLatestFrom } from 'rxjs';

import { SharedService } from './shared.service';
import { app } from "@microsoft/teams-js";

@Component({
  selector: 'gcp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();
  private checkInterval = 1000 * 60 * 60 * 6;  // 6 hours
  public loginDisplay = false;
  public accounts: AccountInfo[] = [];
  public photo$!: Observable<SafeUrl>;
  public isMobile = false;
  public appTitle = '';
  public teams: boolean | undefined;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private activatedRoute: ActivatedRoute,
    private swUpdate: SwUpdate,
    private authService: MsalService,
    private location: Location,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private sharedService: SharedService,
    private observer: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.authService.instance.handleRedirectPromise().then(authResult => {
      const account = this.authService.instance.getActiveAccount();
      if (!account) this.checkAndSetActiveAccount();
    }).catch(err=> console.log(err));

    this.setLoginDisplay();
    this.observer.observe(['(max-width: 600px)']).subscribe(_ => this.isMobile = _.matches);
    this.authService.instance.enableAccountStorageEvents();
    this.sharedService.getBranch().subscribe();

    // Enables auto login/logout in other open windows/tabs
    this.msalBroadcastService.msalSubject$.pipe(
      filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED),
      tap(() => {
        if (this.authService.instance.getAllAccounts().length === 0) {
          this.router.navigate(['/']);
        } else {
          this.setLoginDisplay();
        }
      })
    ).subscribe();

    this.msalBroadcastService.msalSubject$.pipe(
      filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS && msg.payload && msg.payload['account']),
      tap((msg: EventMessage) => this.authService.instance.setActiveAccount(msg.payload ? msg.payload['account'] : null))
    ).subscribe();

    // Periodically check for software updates
    this.msalBroadcastService.inProgress$.pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None),
      takeUntil(this._destroying$),
      tap(() => {
        this.setLoginDisplay();
        this.checkAndSetActiveAccount();
      })
    ).subscribe();

    // Periodically check for software updates
    if (this.swUpdate.isEnabled) {
      withLatestFrom()
      this.swUpdate.versionUpdates.pipe(
        filter((evt: VersionEvent) => evt.type === 'VERSION_READY')
      ).subscribe(() => location.reload());
      this.checkForUpdates();
      interval(this.checkInterval).subscribe(() => this.checkForUpdates());
    }

    // Set the page title based on what is set in the router
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(_ => {
        let child = this.activatedRoute.firstChild;
        if (!child) return;
        while (child.firstChild) child = child.firstChild;
        return child.snapshot.data['title'];
      }),
      tap((ttl: string) => this.sharedService.setTitle(ttl))
    ).subscribe();

    app.getContext().then((context) => {
      if (context === null || context === undefined) {
        console.log('Not Teams');
      } else {
        this.teams = true;
      }
    })
  }

  checkForUpdates(): void {
    this.swUpdate.checkForUpdate().then(
      () => console.log('Checking for application updates')
    ).catch(
      e => console.error('error when checking for update', e)
    );
  }

  setLoginDisplay(): void {
    this.accounts = this.authService.instance.getAllAccounts();
    this.loginDisplay = this.accounts.length > 0;
    if (!this.loginDisplay && this.location.path() === '/logout') this.router.navigate(['/']);
    if (this.loginDisplay) this.getPhoto();
  }

  getPhoto(): void {
    this.photo$ = this.sharedService.getPhoto();
  }

  checkAndSetActiveAccount(): void {
    const activeAccount = this.authService.instance.getActiveAccount();
    const allAccounts = this.authService.instance.getAllAccounts();
    if (!activeAccount && allAccounts.length > 0) {
      this.authService.instance.setActiveAccount(allAccounts[0]);
    }
  }

  login(): void {
    if (this.msalGuardConfig.authRequest){
      this.authService.ssoSilent({...this.msalGuardConfig.authRequest} as RedirectRequest);
    } else {
      this.authService.loginRedirect();
    }
  }

  urlActive(url: string): boolean {
    return this.router.url.startsWith(url);
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}