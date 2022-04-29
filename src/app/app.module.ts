import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MatNativeDateModule, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MsalGuard, MsalInterceptor, MsalGuardConfiguration, MSAL_GUARD_CONFIG, MsalInterceptorConfiguration, MSAL_INTERCEPTOR_CONFIG, MSAL_INSTANCE, MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { BrowserCacheLocation, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { FailedComponent } from './failed/failed.component';
import { SharedModule } from './shared/shared.module';
import { LogoutComponent } from './logout/logout.component';
import { environment } from '../environments/environment';
import { Platform } from '@angular/cdk/platform';

class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
      const currentDate = new Date();
      let year: number = currentDate.getFullYear();
      let month: number = currentDate.getMonth();
      let day: number = currentDate.getDate();

      if ((typeof value === 'string') && 
           ((value.indexOf('/') > -1) || (value.indexOf('.') > -1)  || (value.indexOf('-') > -1))) {

          const str = value.split(/[\./-]/);

          day = !!str[0] ? +str[0] : day;
          month = !!str[1] ? +str[1] - 1 : month;
          year = !!str[2] ?
                // If year is less than 3 digit long, we add 2000.
               +str[2].length <= 3 ? +str[2] + 2000 : +str[2] : year ;

          return new Date(year, month, day);
      }
      return null;
  }
}

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
  protectedResourceMap.set(`${environment.endpoint}/sites`, ['Sites.ReadWrite.All']);
  protectedResourceMap.set(`${environment.endpoint}/`, ['Sites.ReadWrite.All']);//$batch
  protectedResourceMap.set(`${environment.endpoint}/me`, ['user.read']);
  protectedResourceMap.set('https://gardencityplastics.crm6.dynamics.com/api/data/v9.2', ['https://gardencityplastics.crm6.dynamics.com//user_impersonation']);
  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap
  };
}

function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Popup,
    authRequest: {
      scopes: ['user.read', 'Sites.ReadWrite.All', 'https://gardencityplastics.crm6.dynamics.com//user_impersonation']
    },
    loginFailedRoute: "/"
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FailedComponent,
    LogoutComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    SharedModule,
    MatNativeDateModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately'
    })
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'en-AU'},
    {provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE, Platform]},
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
    MsalBroadcastService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
