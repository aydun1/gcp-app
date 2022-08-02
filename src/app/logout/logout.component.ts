import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import { SharedService } from '../shared.service';

@Component({
  selector: 'gcp-logout',
  template: ''
})
export class LogoutComponent implements OnInit {

  constructor(
    private authService: MsalService,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    const account = this.sharedService.getAccount();
    this.authService.logoutRedirect({onRedirectNavigate: () => {return false;}, account});
  }
}