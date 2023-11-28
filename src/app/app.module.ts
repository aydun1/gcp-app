import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, isDevMode } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MatNativeDateModule, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MsalGuard, MsalInterceptor, MsalGuardConfiguration, MSAL_GUARD_CONFIG, MsalInterceptorConfiguration, MSAL_INTERCEPTOR_CONFIG, MSAL_INSTANCE, MsalService, MsalBroadcastService, MsalRedirectComponent } from '@azure/msal-angular';
import { BrowserCacheLocation, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { LogoutComponent } from './logout/logout.component';
import { environment } from '../environments/environment';
import { ThemingService } from './theming.service';
import { ScannerDialogModule } from './scanner-dialog/scanner-dialog.module';
import { CacheInterceptor } from './cache-interceptor.service';

class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: string): Date | null {
    const currentDate = new Date();
    let year: number = currentDate.getFullYear();
    let month: number = currentDate.getMonth();
    let day: number = currentDate.getDate();
    if ((typeof value === 'string') && ((value.indexOf('/') > -1) || (value.indexOf('.') > -1)  || (value.indexOf('-') > -1))) {
      const str = value.split(/[\./-]/);
      day = !!str[0] ? +str[0] : day;
      month = !!str[1] ? +str[1] - 1 : month;
      year = !!str[2] ? +str[2].length <= 3 ? +str[2] + 2000 : +str[2] : year ;
      return new Date(year, month, day);
    }
    return null;
  }
}

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msalConfig.auth.clientId,
      authority: environment.msalConfig.auth.authority,
      redirectUri: environment.redirectUri,
      postLogoutRedirectUri: environment.redirectUri
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage
    },
    system: {
      allowNativeBroker: false
    }
  });
}

function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(`${environment.endpoint}/sites`, ['Sites.ReadWrite.All']);
  protectedResourceMap.set(`${environment.endpoint}/`, ['Sites.ReadWrite.All']);//$batch
  protectedResourceMap.set(`${environment.endpoint}/me`, ['user.read', 'mail.send']);
  protectedResourceMap.set(`${environment.betaEndpoint}/me/profile/positions`, ['Sites.ReadWrite.All']);
  protectedResourceMap.set(`${environment.gpEndpoint}/`, ['api://117fb891-acba-4e2f-b60a-9f95fc0680ff/GCP.API.Access']);
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
      scopes: ['user.read', 'Sites.ReadWrite.All', 'mail.send', 'https://gardencityplastics.crm6.dynamics.com//user_impersonation']
    },
    loginFailedRoute: '/'
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LogoutComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    SharedModule,
    MatNativeDateModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately'
    }),
    ScannerDialogModule
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'en-AU'},
    {provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE, Platform]},
    {provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true},
    {provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory},
    {provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory},
    {provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory},
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    ThemingService
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
