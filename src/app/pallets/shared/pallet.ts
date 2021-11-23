export interface Pallet {
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
    In: string,
    Out: string,
    Quantity: string,
    Change?: number,
    Status: string,
  }
}