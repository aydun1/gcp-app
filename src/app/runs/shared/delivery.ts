export interface Delivery {
  id: string;
  lastModifiedDateTime: string | Date;
  lastModifiedBy?: {
    user: {
      displayName: string;
      email: string;
      id: string;
    }
  }
  fields: {
    id: string;
    Run: string;
    Address: string;
    City: string;
    State: string;
    Postcode: string;
    Branch: string;
    CustomerName: string;
    CustomerNumber: string;
    CustomerType: 'Debtor' | 'Vendor';
    DeliveryDate: Date;
    RequestedDate: Date | null;
    OrderNumber: string;
    Notes: string;
    Site: string;
    Sequence: number;
    Spaces: number;
    Weight: number;
    Status: string;
    Creator: string;
    Created: Date;
  }
}