import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'gcp-logout',
  template: ''
})
export class LogoutComponent implements OnInit {

  constructor(
    private authService: MsalService
  ) { }

  ngOnInit(): void {
    this.authService.logoutPopup();
  }
}