export interface LoadingSchedule {
  createdDateTime: string | Date;
  lastModifiedDateTime: string | Date;
  id: string;
  fields: {
    Reference: string;
    Branch: string;
    Driver: string;
    NetWeight: number;
    Spaces: number;
    Status: string;
    PanLists: string;
    PanListsArray?: Array<string[]>;
    TransportCompany: string;
  }
}