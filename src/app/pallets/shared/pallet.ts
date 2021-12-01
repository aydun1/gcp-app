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
    id: string,
    Title: string,
    From: string,
    To: string,
    Pallet: string,
    In: number,
    Out: number,
    Quantity: string,
    Reference: string,
    Change?: number,
    Status: string,
  }
}