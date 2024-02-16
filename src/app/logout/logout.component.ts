import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import { SharedService } from '../shared.service';

@Component({
  selector: 'gcp-logout',
  template: '',
  standalone: true
})
export class LogoutComponent implements OnInit {

  constructor(
    private authService: MsalService,
    private sharedService: SharedService
  ) { }

  ngOnInit(): void {
    const account = this.sharedService.getAccount();
    this.authService.instance.initialize().then(() => this.authService.logoutRedirect({onRedirectNavigate: () => {return false;}, account}));
  }
}