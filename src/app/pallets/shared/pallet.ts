export interface Pallet {
  id: string,
  Date: any,
  date: string,
  lastModifiedDateTime: string | Date,
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
    Branch: string,
    From: string,
    To: string,
    Pallet: string,
    In: number,
    Out: number,
    Quantity: string,
    Loscam: number,
    Chep: number,
    Plain: number,
    Reference: string,
    Notes: string,
    Change?: number,
    Status: string,
    CustomerNumber: string,
    Site: string,
  }
}