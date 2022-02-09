export interface Cage {
  createdDateTime: string | Date,
  lastModifiedDateTime: string | Date,
  id: string,
  statusId?: number,
  fields : {
    Branch: string,
    CageNumber: number,
    CageWeight: number,
    GrossWeight: number,
    NetWeight: number,
    Status: string | 'Available' | 'Allocated to customer' | 'Delivered to customer' | 'Collected from customer' | 'Delivered to Polymer' | 'Delivered to local processing' | 'Collected from local processing' | 'Collected from Polymer' | 'Complete',
    AssetType: string,
    Date1: string | Date,
    Date2: string | Date,
    Date3: string | Date,
    Date4: string | Date,
    ToLocalProcessing: string | Date,
    FromLocalProcessing: string | Date,
    CustomerNumber: string,
    Customer: string,
    Site: string,
    Notes: string,
    id: string,
    Modified: string | Date,
    Created: string | Date,
    Edit: string
  }
}