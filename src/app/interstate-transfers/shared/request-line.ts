export interface RequestLine {
  id: string;
  lastModifiedDateTime: string | Date;
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
      id: string;
    }
  }
  fields: {
    id: string;
    Title: string;
    PanList: string;
    ItemNumber: string;
    Quantity: number;
  }
}