// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  redirectUri: 'http://localhost:4200',
  gpEndpoint: 'http://localhost:3000/gp',
  endpoint: 'https://graph.microsoft.com/v1.0',
  siteUrl: 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
