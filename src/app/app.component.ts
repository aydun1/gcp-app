import { Component, OnInit, Inject, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { AsyncPipe, Location } from '@angular/common';
import { SafeUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavContainer, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, EventType, AccountInfo, RedirectRequest, AuthenticationResult } from '@azure/msal-browser';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { authentication } from '@microsoft/teams-js';
import { distinctUntilChanged, filter, interval, Observable, Subject, takeUntil, tap } from 'rxjs';

import { SharedService } from './shared.service';
import { TeamsService } from './teams.service';
import { ThemingService } from './theming.service';
import { ScannerDialogComponent } from './shared/scanner-dialog/scanner-dialog.component';
import { DocsService } from './shared/docs/docs.service';

@Component({
  selector: 'gcp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [AsyncPipe, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule, MatMenuModule]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('snav') public sidenav!: MatSidenavContainer;
  private readonly _destroying$ = new Subject<void>();
  private _checkInterval = 1000 * 60 * 60 * 6;  // 6 hours
  private _darkClass = 'dark-theme';
  public isIframe = false;
  public loginDisplay = true;
  public accounts: AccountInfo[] = [];
  public photo$!: Observable<SafeUrl>;
  public isMobile = false;
  public appTitle = '';
  public checkedTeams!: boolean;
  public token: string | undefined;
  public warehouse!: boolean;
  public isQld = false;
  public canSee = {runs: false, all: false};

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private swUpdate: SwUpdate,
    private authService: MsalService,
    private iconRegistry: MatIconRegistry,
    private location: Location,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private docsService: DocsService,
    private msalBroadcastService: MsalBroadcastService,
    private renderer: Renderer2,
    private router: Router,
    private sharedService: SharedService,
    private observer: BreakpointObserver,
    private teamsService: TeamsService,
    private themingService: ThemingService
  ) {
    this.iconRegistry.setDefaultFontSetClass('material-symbols-outlined');
  }

  async ngOnInit(): Promise<void> {
    this.isIframe = window !== window.parent && !window.opener;
    this.authService.handleRedirectObservable().subscribe(_ => {
      console.log('Handling redirect.');
      console.log(_)
    });
    await this.authService.instance.initialize();
    this.login();
    this.docsService.uploads$.pipe(
      distinctUntilChanged((a, b) => {
        if (b > a) {
          this.snackBar.open('Uploading...', '', {duration: 3000})
        } else if (b.length === 0 && a.length > 0) {
          this.snackBar.open('Uploads complete', '', {duration: 3000})
      }
        return a.length === b.length;
      })
    ).subscribe(_ => console.log('Uploads: ', _));

    this.themingService.theme.subscribe(_ => {
      _ ? this.renderer.addClass(document.body, this._darkClass) : this.renderer.removeClass(document.body, this._darkClass)
    });
    this.setLoginDisplay();
    this.checkIfTeams();
    this.observer.observe(['(max-width: 600px)']).subscribe(_ => this.isMobile = _.matches);
    this.authService.instance.enableAccountStorageEvents();
    this.sharedService.getBranch().subscribe(_ => this.isQld = _ === 'QLD');
    authentication.getAuthToken().then(_ => this.token = _).catch(_ => console.log(_));
    // Enables auto login/logout in other open windows/tabs
    this.msalBroadcastService.msalSubject$.pipe(
      filter(msg => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED),
      tap(msg => {
        this.authService.instance.setActiveAccount(msg.payload as AccountInfo);
        this.setLoginDisplay(msg.eventType === EventType.ACCOUNT_ADDED);
      })
    ).subscribe();

    // On interaction
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
      this.swUpdate.versionUpdates.pipe(
        filter((evt: VersionEvent) => evt.type === 'VERSION_READY')
      ).subscribe(() => location.reload());
      this.checkForUpdates();
      interval(this._checkInterval).subscribe(() => this.checkForUpdates());
    }
  }

  checkForUpdates(): void {
    this.swUpdate.checkForUpdate().then(
      () => console.log('Checking for application updates')
    ).catch(
      e => console.error('error when checking for update', e)
    );
  }

  checkIfTeams(): void {
    this.teamsService.isTeams.pipe(
      tap(_ => {
        if (_ !== undefined) this.checkedTeams = true;
        if (_) this.renderer.addClass(document.body, 'teams');
      })
    ).subscribe();
  }

  setLoginDisplay(preset = false): void {
    this.accounts = this.authService.instance.getAllAccounts();
    this.canSee = this.sharedService.getRoles();
    const isLoggedIn = this.accounts.length > 0;
    this.loginDisplay = preset || isLoggedIn;
    this.sharedService.checkIfWarehouse(this.accounts);
    this.warehouse = this.sharedService.isWarehouse;
    if (!isLoggedIn && this.location.path() === '/logout') this.router.navigate(['/']);
    if (isLoggedIn && !this.photo$) this.photo$ = this.sharedService.getPhoto();
  }

  checkAndSetActiveAccount(): void {
    const activeAccount = this.authService.instance.getActiveAccount();
    const allAccounts = this.authService.instance.getAllAccounts();
    if (!activeAccount && allAccounts.length > 0) {
      this.authService.instance.setActiveAccount(allAccounts[0]);
      this.canSee = this.sharedService.getRoles();
    }
  }

  login(): void {
    if (this.msalGuardConfig.authRequest) {
    this.authService.ssoSilent({...this.msalGuardConfig.authRequest} as RedirectRequest).subscribe({
      next: (result: AuthenticationResult) => {
        console.log('SsoSilent succeeded!');
      },
      error: (error) => {
        console.log(error);
        console.log('SsoSilent failed. Redirecting to login page.');
        this.authService.loginRedirect();
      }
    });
    } else {
      console.log('Redirecting to login page.');
      this.authService.loginRedirect();
    }
  }

  urlActive(url: string): boolean {
    return this.router.url.startsWith(url);
  }

  closeMenu(): void {
    if (this.isMobile) this.sidenav.close();
  }

  openScannerDialog() {
    const data = {camera: this.isMobile};
    this.dialog.open(ScannerDialogComponent, {data, width: '800px', autoFocus: !this.isMobile});
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}