export interface Delivery {
  id: string,
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
    Address: string,
    Branch: string,
    Customer: string,
    CustomerNumber: string,
    CustomerId: string,
    Notes: string,
    Site: string,
    Sequence: number,
    Status: string
  }
}