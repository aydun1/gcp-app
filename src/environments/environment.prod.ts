const apiUrl = 'https://api.gardencityplastics.com';
const baseUri = 'https://ims.gardencityplastics.com';
export const environment = {
  production: true,
  baseUri,
  apiUrl,
  redirectUri: `${baseUri}/auth`,
  gpEndpoint: `${apiUrl}/gp`,
  cwEndpoint: `${apiUrl}/cw`,
  sdsEndpoint: `${apiUrl}/public`,
  endpoint: 'https://graph.microsoft.com/v1.0',
  betaEndpoint: 'https://graph.microsoft.com/beta',
  siteUrl: 'sites/c63a4e9a-0d76-4cc0-a321-b2ce5eb6ddd4',
  msalConfig: {
		auth: {
			clientId: 'bd14159c-f62e-4ffe-bb05-e5a26f9715ed',
			authority: 'https://login.microsoftonline.com/2dcb64e0-c4e4-4c31-af32-9fe0edff2be9'
		}
  }
};
