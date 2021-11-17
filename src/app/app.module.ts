import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';

import { MsalGuard, MsalInterceptor, MsalGuardConfiguration, MSAL_GUARD_CONFIG, MsalInterceptorConfiguration, MSAL_INTERCEPTOR_CONFIG, MSAL_INSTANCE, MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { BrowserCacheLocation, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { FailedComponent } from './failed/failed.component';
import { environment } from '../environments/environment';
import { SharedModule } from './shared/shared.module';
import { MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';



function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: 'bd14159c-f62e-4ffe-bb05-e5a26f9715ed',
      authority: 'https://login.microsoftonline.com/2dcb64e0-c4e4-4c31-af32-9fe0edff2be9',
      redirectUri: environment.redirectUri,
      postLogoutRedirectUri: environment.redirectUri
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false,
    }
  });
}

function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/sites', ['Sites.ReadWrite.All']);
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);
  protectedResourceMap.set('https://graph.microsoft.com/beta/me', ['user.read']);
  protectedResourceMap.set('https://gardencityplastics.crm6.dynamics.com/api/data/v9.2', ['https://gardencityplastics.crm6.dynamics.com//user_impersonation']);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['user.read', 'Sites.ReadWrite.All', 'https://gardencityplastics.crm6.dynamics.com//user_impersonation']
    },
    loginFailedRoute: '/login-failed'
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProfileComponent,
    FailedComponent
  ],
  imports: [
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    SharedModule
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'en-AU'},
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    NativeDateAdapter
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
