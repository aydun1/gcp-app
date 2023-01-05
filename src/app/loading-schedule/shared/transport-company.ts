export interface TransportCompany {
  createdDateTime: string | Date;
  lastModifiedDateTime: string | Date;
  id: string;
  fields: {
    Title: string;
    Branch: string;
    Drivers: string;
    DriversArray?: Array<string>;
  }
}