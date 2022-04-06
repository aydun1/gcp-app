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
    Branch: string,
    Customer: string,
    CustomerNumber: string,
    Site: string
  }
}