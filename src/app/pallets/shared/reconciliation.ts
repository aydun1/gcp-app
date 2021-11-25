export interface Reconciliation {
  id: string,
  lastModifiedDateTime: any,
  lastModifiedBy: {
    user: {
      displayName: string,
      email: string,
      id: string
    }
  }
  fields: {
    Title: string,
    From: string,
    To: string,
    Pallet: string,
    In: number,
    Out: number,
    Quantity: string,
    Change?: number,
    Status: string,
  }
}