import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { AuthenticationResult, InteractionStatus, PopupRequest, EventMessage, EventType, AccountInfo } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { SharedService } from './shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();
  public title = 'Garden City Plastics';
  public loginDisplay: boolean;
  public accounts: AccountInfo[];
  public photo$: any;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.setLoginDisplay();
    this.authService.instance.enableAccountStorageEvents();

    this.msalBroadcastService.msalSubject$.pipe(
      filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED)
    ).subscribe((result: EventMessage) => {
      if (this.authService.instance.getAllAccounts().length === 0) {
        window.location.pathname = '/';
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
    })
  }

  setLoginDisplay() {
    const accounts = this.authService.instance.getAllAccounts();
    this.accounts = accounts;
    this.loginDisplay = accounts.length > 0;
    if (this.loginDisplay) this.getPhoto();
  }

  getPhoto() {
    this.photo$ = this.sharedService.getPhoto();
  }

  checkAndSetActiveAccount(){
    const activeAccount = this.authService.instance.getActiveAccount();
    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      const accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
    }
  }

  login() {
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

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}