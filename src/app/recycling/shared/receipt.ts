export interface Receipt {
  createdDateTime: string | Date,
  lastModifiedDateTime: string | Date,
  id: string,
  fields: {
    Reference: string,
    Branch: string,
    NetWeight: number,
  }
}