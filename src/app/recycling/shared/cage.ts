export interface Cage {
  createdDateTime: string | Date,
  lastModifiedDateTime: string | Date,
  id: string,
  statusId?: number,
  fields : {
    Branch: string,
    BinNumber2: number,
    Status: string,
    AssetType: string,
    EmptyReceivedDate: string | Date,
    PurchaseDate: string | Date,
    DueDate: string | Date,
    CollectionDate: string | Date,
    CustomerNumber: string,
    Customer: string,
    id: string,
    Modified: string | Date,
    Created: string | Date,
    Edit: string,
    Weight: number
  }
}