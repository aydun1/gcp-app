import { Injectable, enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {Title, bootstrapApplication} from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterStateSnapshot, TitleStrategy, provideRouter, withRouterConfig } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Platform } from '@angular/cdk/platform';
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalBroadcastService, MsalGuard, MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalRedirectComponent, MsalService } from '@azure/msal-angular';
import { BrowserCacheLocation, IPublicClientApplication, InteractionType, PublicClientApplication } from '@azure/msal-browser';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { CacheInterceptor } from './app/cache-interceptor.service';
import { routes } from './app/app-routes';
import { GroupByCustomerAddressPipe } from './app/shared/pipes/group-by-customer-address';

if (environment.production) {
  enableProdMode();
}


@Injectable()
export class ImsTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    const pageTitle = title !== undefined ? `${title} | IMS` : 'Inventory Management System'
    this.title.setTitle(pageTitle);
  }
}

class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: string): Date | null {
    const currentDate = new Date();
    let year: number = currentDate.getFullYear();
    let month: number = currentDate.getMonth();
    let day: number = currentDate.getDate();
    if ((typeof value === 'string') && ((value.indexOf('/') > -1) || (value.indexOf('.') > -1)  || (value.indexOf('-') > -1))) {
      const str = value.split(/[\./-]/);
      day = str[0] ? +str[0] : day;
      month = str[1] ? +str[1] - 1 : month;
      year = str[2] ? +str[2].length <= 3 ? +str[2] + 2000 : +str[2] : year;
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

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(MatSnackBarModule),
    importProvidersFrom(MatDialogModule),
    importProvidersFrom(MatNativeDateModule),
    { provide: TitleStrategy, useClass: ImsTitleStrategy },
    { provide: MAT_DATE_LOCALE, useValue: 'en-AU' },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    GroupByCustomerAddressPipe,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
}).then(_ => _.bootstrap(MsalRedirectComponent)).catch(err => console.error(err));