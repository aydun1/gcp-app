export interface Delivery {
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
    Address: string;
    City: string;
    State: string;
    PostCode: string;
    Branch: string;
    Customer: string;
    CustomerNumber: string;
    OrderNumber: string;
    Notes: string;
    Site: string;
    Sequence: number;
    Spaces: number;
    Weight: number;
    Status: string;
  }
}