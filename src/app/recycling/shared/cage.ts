export interface Cage {
  createdDateTime: string | Date,
  lastModifiedDateTime: string | Date,
  id: string,
  statusId?: number,
  fields : {
    Branch: string,
    CageNumber: number,
    Status: string,
    AssetType: string,
    Date1: string | Date,
    Date2: string | Date,
    Date3: string | Date,
    Date4: string | Date,
    CustomerNumber: string,
    Customer: string,
    id: string,
    Modified: string | Date,
    Created: string | Date,
    Edit: string,
    Weight: number
  }
}