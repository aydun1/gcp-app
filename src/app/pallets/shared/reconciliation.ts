export interface Reconciliation {
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
    Title: string;
    Branch: string;
    Pallet: string;
    CurrentBalance: number;
    OnSite: number;
    OffSite: number;
    ToBeCollected: number;
    ToBeRepaid: number;
    InTransitOff: number;
    InTransitOn: number;
    Quantity: number;
    Surplus: number;
    Deficit: number;
    Created: string;
    Date: Date;
  }
}